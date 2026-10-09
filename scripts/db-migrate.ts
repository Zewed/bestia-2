// Applique les migrations en attente, dans l'ordre : npm run db:migrate
import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { entreesDuJournal, findDestructiveStatements, MIGRATIONS_FOLDER, migrationsSautees } from "../src/db/migrations";
import { assertNotProductionDatabase } from "../src/db/production";
import { assertEnv } from "../src/env";

async function appliedCount(db: ReturnType<typeof drizzle>): Promise<number> {
  const registry = await db.execute<{ exists: boolean }>(
    sql`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`,
  );
  if (!registry.rows[0]?.exists) return 0;
  const result = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
  );
  return result.rows[0]?.count ?? 0;
}

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  let pool;
  try {
    assertEnv();
    const problems = findDestructiveStatements();
    if (problems.length > 0) {
      throw new Error(`Migrations refusées :\n${problems.map((p) => `  ${p}`).join("\n")}`);
    }
    // La connexion directe quand elle existe : une migration ne doit pas passer par le pool.
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    // Seule la production migre la base de production (VERCEL_ENV=production).
    const identity = await assertNotProductionDatabase(pool, "Migration refusée");
    const db = drizzle(pool);
    const before = await appliedCount(db);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    const after = await appliedCount(db);
    // Une migration dont l'instant précède celui d'une autre déjà appliquée serait sautée sans erreur : on le refuse.
    const retenues = await db.execute<{ created_at: string }>(sql`select created_at from drizzle.__drizzle_migrations`);
    const sautees = migrationsSautees(entreesDuJournal(), retenues.rows.map((r) => Number(r.created_at)));
    if (sautees.length > 0) {
      throw new Error(`Migrations sautées par Drizzle, leur instant (when) précédant une migration déjà appliquée : ${sautees.join(", ")}. Renumérote-les après la dernière.`);
    }
    const applied = after - before;
    const name = identity.branch ? `${identity.database} (branche ${identity.branch})` : identity.database;
    console.log(
      applied === 0
        ? `Base ${name} déjà à jour : ${after} migration(s), rien à appliquer.`
        : `Base ${name} : ${applied} migration(s) appliquée(s), ${after} au total. Base à jour.`,
    );
  } catch (error) {
    const message = isConnectionError(error)
      ? explainDatabaseError(error).message
      : error instanceof Error
        ? error.message
        : String(error);
    console.error(message);
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
