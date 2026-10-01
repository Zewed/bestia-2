// Avant les tests : met la base de test à jour, après avoir vérifié qu'elle en est bien une.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { MIGRATIONS_FOLDER } from "@/db/migrations";
import { identifyDatabase } from "@/db/production";
import { poolDeTest, URL_TEST } from "./base";

export default async function preparerBase() {
  if (!URL_TEST) {
    console.log("Pas de base de test : les tests sur base sont sautés (npm run db:test-setup pour les lancer).");
    return;
  }
  const pool = poolDeTest();
  try {
    const identite = await identifyDatabase(pool);
    if (identite.isProduction || !identite.database.includes("test")) {
      throw new Error(`Base de test refusée : « ${identite.database} » doit contenir « test » et ne jamais être la production.`);
    }
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
