// Crée une base à part de la production dans le même projet Neon, et écrit le fichier
// d'environnement qui la désigne :
//   npm run db:dev-setup    bestia_dev, pour le poste local (.env.development.local)
//   npm run db:test-setup   bestia_test, pour les tests sur base (.env.test.local)
// Le mot de passe passe d'un fichier à l'autre sans jamais être affiché.
import { existsSync, writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { createPool, explainDatabaseError, isConnectionError } from "../src/db";
import { env } from "../src/env";

const CIBLES = {
  dev: { base: "bestia_dev", fichier: ".env.development.local", variable: "DATABASE_URL", direct: "DATABASE_URL_UNPOOLED" },
  test: { base: "bestia_test", fichier: ".env.test.local", variable: "TEST_DATABASE_URL", direct: null },
} as const;
const cible = CIBLES[process.argv.includes("--test") ? "test" : "dev"];
const DEV_DATABASE = cible.base;
const TARGET = cible.fichier;

function toDevUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${DEV_DATABASE}`;
  return parsed.toString();
}

async function main() {
  if (existsSync(TARGET)) {
    console.log(`${TARGET} existe déjà : la base ${DEV_DATABASE} est en place.`);
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
      `# Base ${DEV_DATABASE}, distincte de la production. Écrit par scripts/db-dev-setup.ts.\n` +
        `${cible.variable}=${toDevUrl(cible.direct ? url : unpooled)}\n` +
        (cible.direct ? `${cible.direct}=${toDevUrl(unpooled)}\n` : ""),
      { mode: 0o600 },
    );
    console.log(`Base ${DEV_DATABASE} prête et ${TARGET} écrit.`);
  } catch (error) {
    console.error(isConnectionError(error) ? explainDatabaseError(error).message : String(error));
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
