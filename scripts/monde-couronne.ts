// Prépare la Couronne du Monde du jeu en base : npm run monde:couronne
// Se relance sans risque (une Case existante n'est jamais touchée) ; il tourne aussi à chaque mise
// en ligne, après les données de référence, dont il utilise les Biomes.
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { assertEnv } from "../src/env";
import { preparerCouronne } from "../src/monde/preparer-couronne";

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    assertEnv();
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    const client = await pool.connect();
    try {
      await client.query("begin");
      // Le Monde du jeu : le seul pour l'instant, le premier ouvert.
      const { rows } = await client.query<{ id: number; nom: string }>("select id, nom from monde order by id limit 1");
      if (!rows[0]) throw new Error("Aucun Monde en base : lancez d'abord npm run db:migrate.");
      const { ajoutees, total } = await preparerCouronne(client, rows[0].id);
      await client.query("commit");
      console.log(`Couronne du Monde « ${rows[0].nom} » : ${ajoutees} Case(s) ajoutée(s), ${total} au total.`);
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
