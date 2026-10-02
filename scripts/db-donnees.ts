// Charge les données de référence (dossier donnees/) en base, sans doublon : npm run db:donnees
// Se relance sans risque ; il tourne aussi à chaque mise en ligne, après les migrations.
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { chargerJeu, lireJeu } from "../src/donnees/charger";
import {
  BIOMES,
  COUPLES_DE_DEPART,
  ESPECES,
  JEUX,
  RARETES,
  ROLES,
  verifierCouples,
  verifierReferences,
  type EntreeCouple,
  type EntreeEspece,
} from "../src/donnees/jeux";
import { assertEnv } from "../src/env";

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    assertEnv();
    // Toutes les données sont validées avant d'écrire quoi que ce soit.
    const lots = JEUX.map((jeu) => ({ jeu, entrees: lireJeu(jeu) }));
    const ids = (jeu: unknown) => lots.find((l) => l.jeu === jeu)!.entrees.map((e: { id: string }) => e.id);
    verifierReferences(lots.find((l) => l.jeu === ESPECES)!.entrees as EntreeEspece[], {
      biomes: ids(BIOMES),
      raretes: ids(RARETES),
      roles: ids(ROLES),
    });
    verifierCouples(lots.find((l) => l.jeu === COUPLES_DE_DEPART)!.entrees as EntreeCouple[], ids(ESPECES));
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const { jeu, entrees } of lots) {
        const b = await chargerJeu(client, jeu, entrees);
        console.log(`${jeu.nom} : ${b.ajoutes} ajouté(s), ${b.modifies} modifié(s), ${b.inchanges} inchangé(s).`);
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    if (lots.length === 0) console.log("Aucune donnée de référence à charger pour l'instant.");
  } catch (error) {
    console.error(isConnectionError(error) ? explainDatabaseError(error).message : error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
