import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MIGRATIONS_FOLDER } from "@/db/migrations";
import { lireJeu, valider } from "./charger";
import { PRENOMS } from "./jeux";

describe("prénoms des Habitants (US-0303)", () => {
  const prenoms = lireJeu(PRENOMS).map((p) => p.nom);

  it("sont une soixantaine, de quoi donner trois prénoms différents à chaque Territoire", () => {
    expect(prenoms.length).toBeGreaterThanOrEqual(50);
    expect(prenoms.length).toBeLessThanOrEqual(80);
  });

  it("n'ont aucun doublon, même à la casse près", () => {
    expect(new Set(prenoms.map((p) => p.toLowerCase())).size).toBe(prenoms.length);
  });

  it("sont courts et faits de lettres seulement, sans accent", () => {
    for (const p of prenoms) {
      expect(p, p).toMatch(/^[A-Z][a-z]+$/);
      expect(p.length, p).toBeGreaterThanOrEqual(3);
      expect(p.length, p).toBeLessThanOrEqual(6);
    }
  });

  it.each([
    ["un prénom trop long", "Barnabelle"],
    ["un prénom accentué", "Élio"],
    ["un prénom sans majuscule", "arno"],
    ["un prénom qui n'est pas fait que de lettres", "Ar-no"],
  ])("refusent %s", (_, nom) => {
    expect(() => valider(PRENOMS, [{ nom, ordre: 1 }])).toThrow("prénom : une majuscule puis 2 à 5 minuscules, sans accent");
  });

  it("refusent un prénom en double, en disant lequel", () => {
    expect(() => valider(PRENOMS, [{ nom: "Arno", ordre: 1 }, { nom: "Arno", ordre: 2 }])).toThrow("la clé « Arno » existe déjà");
  });

  it("gardent l'ordre du fichier", () => {
    expect(lireJeu(PRENOMS).map((p) => p.ordre)).toEqual(prenoms.map((_, i) => i + 1));
  });

  it("sont ceux que la migration sème, pour nommer les Habitants avant le chargement des données", () => {
    const migration = readdirSync(MIGRATIONS_FOLDER)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(MIGRATIONS_FOLDER, f), "utf8"))
      .find((sql) => sql.includes('INSERT INTO "prenom"'));
    const semes = [...migration!.matchAll(/\('([^']+)', (\d+)\)/g)].map(([, nom]) => nom);
    expect(semes.length).toBeGreaterThanOrEqual(3);
    for (const nom of semes) expect(prenoms, nom).toContain(nom);
  });
});
