import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool, PoolClient } from "pg";
import { createPool } from "@/db";
import { chargerJeu } from "@/donnees/charger";
import { lireDonnees } from "@/donnees/jeux";
import { preparerCouronne } from "@/monde/preparer-couronne";

/**
 * L'adresse de la base réservée aux tests : TEST_DATABASE_URL, sinon .env.test.local
 * (écrit par npm run db:test-setup). Sans elle, les tests sur base sont sautés.
 */
export function urlBaseDeTest(): string | undefined {
  if (process.env.TEST_DATABASE_URL?.trim()) return process.env.TEST_DATABASE_URL.trim();
  const fichier = join(process.cwd(), ".env.test.local");
  if (!existsSync(fichier)) return undefined;
  const ligne = readFileSync(fichier, "utf8").match(/^TEST_DATABASE_URL=(.+)$/m);
  return ligne?.[1].trim() || undefined;
}

export const URL_TEST = urlBaseDeTest();

export function poolDeTest(reglages?: { max?: number; connectionTimeoutMillis?: number }) {
  if (!URL_TEST) throw new Error("Pas de base de test : lancez npm run db:test-setup.");
  return createPool(URL_TEST, reglages);
}

/**
 * Prépare pour de bon la base de test comme une base en ligne : les données de référence et la
 * Couronne du Monde du jeu (US-0153). Se relance sans risque, même depuis plusieurs fichiers de
 * test à la fois. Comme à la mise en ligne, les données puis la Couronne passent chacune dans sa
 * transaction : réunies, elles tiendraient les Ressources en attendant le Monde, quand une naissance
 * d'un autre fichier tient le Monde en attendant les Ressources de ses Stocks, et se bloqueraient.
 */
export async function preparerMondeDeTest(pool: Pool): Promise<void> {
  await enTransaction(pool, async (client) => {
    for (const { jeu, entrees } of lireDonnees()) await chargerJeu(client, jeu, entrees);
  });
  await enTransaction(pool, async (client) => {
    const { rows } = await client.query<{ id: number }>("select id from monde order by id limit 1");
    await preparerCouronne(client, rows[0].id);
  });
}

/** Une transaction à la fois pour tous les fichiers de test qui préparent la base. */
async function enTransaction(pool: Pool, travail: (client: PoolClient) => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(4153)");
    await travail(client);
    await client.query("commit");
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}
