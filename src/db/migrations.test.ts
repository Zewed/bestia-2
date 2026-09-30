import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findDestructiveStatements } from "./migrations";

let folder: string | undefined;

function migrations(files: Record<string, string>): string {
  folder = mkdtempSync(join(tmpdir(), "bestia-migrations-"));
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(folder, name), sql);
  return folder;
}

afterEach(() => {
  if (folder) rmSync(folder, { recursive: true, force: true });
  folder = undefined;
});

describe("garde-fou des migrations", () => {
  it("laisse passer les migrations réelles du dépôt", () => {
    expect(findDestructiveStatements("drizzle")).toEqual([]);
  });

  it("laisse passer ce qui ajoute ou assouplit sans rien effacer", () => {
    const dir = migrations({
      "0001_ajout.sql": [
        'CREATE TABLE "espece" ("id" serial PRIMARY KEY, "nom" text NOT NULL);',
        'ALTER TABLE "espece" ADD COLUMN "rarete" text;',
        'ALTER TABLE "espece" ALTER COLUMN "nom" DROP NOT NULL;',
        'ALTER TABLE "espece" ALTER COLUMN "rarete" DROP DEFAULT;',
        'ALTER TABLE "espece" DROP CONSTRAINT "espece_nom_unique";',
      ].join("\n--> statement-breakpoint\n"),
    });
    expect(findDestructiveStatements(dir)).toEqual([]);
  });

  it.each([
    ['TRUNCATE "monde";', "TRUNCATE"],
    ['DELETE FROM "monde";', "DELETE FROM"],
    ['DROP TABLE "monde";', "DROP TABLE"],
    ['DROP SCHEMA "public" CASCADE;', "DROP SCHEMA"],
    ['ALTER TABLE "monde" DROP COLUMN "nom";', "DROP COLUMN"],
    ['ALTER TABLE "monde" DROP "nom";', "DROP COLUMN"],
  ])("refuse %s", (sql, rule) => {
    const [problem] = findDestructiveStatements(migrations({ "0001_casse.sql": sql }));
    expect(problem).toContain("0001_casse.sql:1");
    expect(problem).toContain(rule);
  });

  it("repère une instruction sur plusieurs lignes et donne la ligne où elle commence", () => {
    const dir = migrations({
      "0002_casse.sql": 'CREATE TABLE "a" ("id" int);\n\nALTER TABLE "monde"\n  DROP COLUMN "nom";\n',
    });
    expect(findDestructiveStatements(dir)).toEqual([expect.stringContaining("0002_casse.sql:3")]);
  });

  it("ignore les commentaires", () => {
    const dir = migrations({ "0003_note.sql": "-- DROP TABLE monde\n/* TRUNCATE monde; */\nSELECT 1;" });
    expect(findDestructiveStatements(dir)).toEqual([]);
  });

  it("ne trouve rien quand le dossier n'existe pas", () => {
    expect(findDestructiveStatements(join(tmpdir(), "bestia-dossier-absent"))).toEqual([]);
  });
});
