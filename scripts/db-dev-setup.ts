// Crée la base de développement, à part de la production dans le même projet Neon,
// et écrit .env.development.local pour que le poste local s'en serve : npm run db:dev-setup
// Le mot de passe passe d'un fichier à l'autre sans jamais être affiché.
import { existsSync, writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { env } from "../src/env";

const DEV_DATABASE = "bestia_dev";
const TARGET = ".env.development.local";

function toDevUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${DEV_DATABASE}`;
  return parsed.toString();
}

async function main() {
  if (existsSync(TARGET)) {
    console.log(`${TARGET} existe déjà : la base de développement est en place.`);
    return;
  }
  // Mode production : on part volontairement de l'adresse de production tirée de Vercel (.env.local).
  loadEnvConfig(process.cwd(), false);
  let pool;
  try {
    const url = env("DATABASE_URL");
    const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim() || url;
    pool = createPool(unpooled);
    const found = await pool.query("select 1 from pg_database where datname = $1", [DEV_DATABASE]);
    if (found.rowCount === 0) await pool.query(`create database ${DEV_DATABASE}`);
    writeFileSync(
      TARGET,
      "# Base de développement, distincte de la production. Écrit par npm run db:dev-setup.\n" +
        `DATABASE_URL=${toDevUrl(url)}\nDATABASE_URL_UNPOOLED=${toDevUrl(unpooled)}\n`,
      { mode: 0o600 },
    );
    console.log(`Base ${DEV_DATABASE} prête et ${TARGET} écrit. Lancez npm run db:migrate.`);
  } catch (error) {
    console.error(isConnectionError(error) ? explainDatabaseError(error).message : String(error));
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
