// Applique les migrations en attente, dans l'ordre : npm run db:migrate
import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { findDestructiveStatements, MIGRATIONS_FOLDER } from "../src/db/migrations";
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
  loadEnvConfig(process.cwd());
  let pool;
  try {
    assertEnv();
    const problems = findDestructiveStatements();
    if (problems.length > 0) {
      throw new Error(`Migrations refusées :\n${problems.map((p) => `  ${p}`).join("\n")}`);
    }
    // La connexion directe quand elle existe : une migration ne doit pas passer par le pool.
    pool = createPool(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL!);
    const db = drizzle(pool);
    const before = await appliedCount(db);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    const after = await appliedCount(db);
    const applied = after - before;
    console.log(
      applied === 0
        ? `Base déjà à jour : ${after} migration(s), rien à appliquer.`
        : `${applied} migration(s) appliquée(s), ${after} au total. Base à jour.`,
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
