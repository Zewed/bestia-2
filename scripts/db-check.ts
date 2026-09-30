// Vérifie que le jeu lit et écrit dans sa base : npm run db:check
import { loadEnvConfig } from "@next/env";
import { closeDb } from "../src/db";
import { checkDatabase } from "../src/db/check";

async function main() {
  loadEnvConfig(process.cwd());
  try {
    const { read } = await checkDatabase();
    console.log(`Base OK : ligne écrite puis relue à l'identique (« ${read} »).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

void main();
