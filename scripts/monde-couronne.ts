// Prépare la Couronne du Monde du jeu en base : npm run monde:couronne
// Se relance sans risque (une Case existante n'est jamais touchée) ; il tourne aussi à chaque mise
// en ligne, après les données de référence, dont il utilise les Biomes. Sur un Monde généré, il ne fait rien.
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { assertEnv } from "../src/env";
import { preparerLaCouronneDuJeu } from "../src/monde/preparer-couronne";

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    assertEnv();
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    const client = await pool.connect();
    try {
      await client.query("begin");
      // US-0414 : le Monde du jeu, le Monde ouvert, s'il n'a que sa Couronne ; un Monde généré a déjà toutes ses Cases.
      const { monde, preparee } = await preparerLaCouronneDuJeu(client);
      await client.query("commit");
      console.log(
        preparee
          ? `Couronne du Monde « ${monde} » : ${preparee.ajoutees} Case(s) ajoutée(s), ${preparee.total} au total.`
          : `Monde « ${monde} » généré en entier : rien à préparer.`,
      );
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
