import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createPool } from "@/db";

/**
 * L'adresse de la base réservée aux tests : TEST_DATABASE_URL, sinon .env.test.local
 * (écrit par npm run db:test-setup). Sans elle, les tests sur base sont sautés.
 */
export function urlBaseDeTest(): string | undefined {
  if (process.env.TEST_DATABASE_URL?.trim()) return process.env.TEST_DATABASE_URL.trim();
  const fichier = join(process.cwd(), ".env.test.local");
  if (!existsSync(fichier)) return undefined;
  const ligne = readFileSync(fichier, "utf8").match(/^TEST_DATABASE_URL=(.+)$/m);
  return ligne?.[1].trim() || undefined;
}

export const URL_TEST = urlBaseDeTest();

export function poolDeTest() {
  if (!URL_TEST) throw new Error("Pas de base de test : lancez npm run db:test-setup.");
  return createPool(URL_TEST);
}
