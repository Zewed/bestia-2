// Génère un nouveau Monde à partir d'une graine (US-0401) : npm run monde:generer -- --nom "Essai" --graine 12345
// Sans --graine, une graine est tirée au hasard puis affichée : elle suffit à recréer le même Monde.
// Le nom doit être libre : le Monde du jeu n'est jamais touché. Ne tourne pas à la mise en ligne.
import { randomInt } from "node:crypto";
import { parseArgs } from "node:util";
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { assertEnv } from "../src/env";
import { creerUnMonde, GRAINE_MAX, lireUneGraine } from "../src/monde/generer";

const USAGE = 'Usage : npm run monde:generer -- --nom "Essai" [--graine 12345]';

/** Le nom et la graine demandés ; la graine est tirée au hasard quand elle manque. */
function lireLesOptions(): { nom: string; graine: number; tiree: boolean } {
  let valeurs;
  try {
    valeurs = parseArgs({ options: { nom: { type: "string" }, graine: { type: "string" } } }).values;
  } catch {
    throw new Error(USAGE);
  }
  const nom = valeurs.nom?.trim();
  if (!nom) throw new Error(`Le nouveau Monde a besoin d'un nom. ${USAGE}`);
  if (valeurs.graine === undefined) return { nom, graine: randomInt(GRAINE_MAX + 1), tiree: true };
  return { nom, graine: lireUneGraine(valeurs.graine), tiree: false };
}

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    const { nom, graine, tiree } = lireLesOptions();
    assertEnv();
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { cases, emplacements } = await creerUnMonde(client, { nom, graine });
      await client.query("commit");
      console.log(`Monde « ${nom} » créé : ${cases} Cases, ${emplacements} emplacements de naissance, graine ${graine}${tiree ? " (tirée au hasard)" : ""}.`);
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(isConnectionError(error) ? explainDatabaseError(error).message : error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
