// Charge les données de référence (dossier donnees/) en base, sans doublon : npm run db:donnees
// Se relance sans risque ; il tourne aussi à chaque mise en ligne, après les migrations.
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { chargerJeu } from "../src/donnees/charger";
import { lireDonneesPour } from "../src/donnees/jeux";
import { assertEnv } from "../src/env";

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    assertEnv();
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    // Toutes les données sont validées, et vérifiées entre elles, avant d'écrire quoi que ce soit. US-0924 : les
    // Espèces d'essai n'en sont qu'en développement, jamais en ligne ni sur la base de production.
    const lots = await lireDonneesPour(pool);
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
