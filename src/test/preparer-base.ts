// Avant les tests : met la base de test à jour, après avoir vérifié qu'elle en est bien une.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { entreesDuJournal, MIGRATIONS_FOLDER, migrationsSautees } from "@/db/migrations";
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
    // Comme npm run db:migrate : une migration sautée par Drizzle (son instant avant celui d'une autre) arrête les tests.
    const { rows } = await pool.query<{ created_at: string }>("select created_at from drizzle.__drizzle_migrations");
    const sautees = migrationsSautees(entreesDuJournal(), rows.map((r) => Number(r.created_at)));
    if (sautees.length > 0) throw new Error(`Migrations sautées par Drizzle : ${sautees.join(", ")}. Renumérote-les après la dernière.`);
  } finally {
    await pool.end();
  }
}
