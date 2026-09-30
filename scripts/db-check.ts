// Vérifie que le jeu lit et écrit dans sa base : npm run db:check
import { loadEnvConfig } from "@next/env";
import { closeDb } from "../src/db";
import { assertEnv } from "../src/env";
import { checkDatabase } from "../src/db/check";

async function main() {
  loadEnvConfig(process.cwd(), true); // en local : .env.development.local passe avant .env.local
  try {
    assertEnv();
    const { database, read } = await checkDatabase();
    console.log(`Base ${database} OK : ligne écrite puis relue à l'identique (« ${read} »).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

void main();
