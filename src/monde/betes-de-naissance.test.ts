import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BETES_DE_NAISSANCE } from "@/reglages";
import { type CaseLibre, tirerLesBetesDeNaissance } from "./betes-de-naissance";

/** Des communes pour les essais : deux en prairie, une dans l'eau ; la jungle n'en a aucune. */
const COMMUNES = new Map([
  ["prairie", ["p1", "p2"]],
  ["eau", ["e1"]],
]);

/** `n` Cases du Biome `biome`, numérotées à partir de `depuis`. */
const desCases = (n: number, biome: string, depuis = 1): CaseLibre[] => Array.from({ length: n }, (_, i) => ({ id: depuis + i, biome }));

/** Un hasard rejouable, de 0 à 1 (exclu), pour des tirages en nombre. */
function hasardRejouable(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1_664_525) + 1_013_904_223) >>> 0;
    return etat / 2 ** 32;
  };
}

describe("les Bêtes de naissance tirées autour d'un Foyer (US-0975)", () => {
  it(`en tire ${BETES_DE_NAISSANCE}, une par Case, chacune sur une Case différente`, () => {
    const hasard = hasardRejouable(1);
    for (let essai = 0; essai < 200; essai++) {
      const tirees = tirerLesBetesDeNaissance(desCases(10, "prairie"), COMMUNES, hasard);
      expect(tirees).toHaveLength(BETES_DE_NAISSANCE);
      expect(new Set(tirees.map((b) => b.caseId)).size).toBe(BETES_DE_NAISSANCE);
    }
    // Même quand le hasard tombe toujours au même endroit.
    for (const fixe of [0, 0.5, 0.999999]) expect(new Set(tirerLesBetesDeNaissance(desCases(10, "prairie"), COMMUNES, () => fixe).map((b) => b.caseId)).size).toBe(3);
  });

  it("tire l'Espèce de chacune parmi les communes du Biome de sa Case, chacune avec sa chance", () => {
    const cases = [...desCases(3, "prairie"), ...desCases(3, "eau", 10)];
    const biome = new Map(cases.map((c) => [c.id, c.biome]));
    const vues = new Map<string, Set<string>>();
    const hasard = hasardRejouable(2);
    for (let essai = 0; essai < 300; essai++) {
      for (const { caseId, especeId } of tirerLesBetesDeNaissance(cases, COMMUNES, hasard)) {
        const leBiome = biome.get(caseId)!;
        expect(COMMUNES.get(leBiome)).toContain(especeId);
        vues.set(leBiome, (vues.get(leBiome) ?? new Set()).add(especeId));
      }
    }
    expect(vues).toEqual(new Map([...COMMUNES].map(([b, especes]) => [b, new Set(especes)])));
  });

  it("ne choisit jamais une Case dont le Biome n'a aucune commune", () => {
    const cases = [...desCases(20, "jungle"), ...desCases(4, "prairie", 100)];
    const hasard = hasardRejouable(3);
    const choisies = new Set<number>();
    for (let essai = 0; essai < 300; essai++) for (const b of tirerLesBetesDeNaissance(cases, COMMUNES, hasard)) choisies.add(b.caseId);
    // Toutes les Cases possibles ont leur chance, et elles seules.
    expect([...choisies].sort((a, b) => a - b)).toEqual([100, 101, 102, 103]);
  });

  it("en tire moins quand les Cases possibles manquent, aucune sans Case possible", () => {
    expect(tirerLesBetesDeNaissance([...desCases(2, "eau"), ...desCases(5, "jungle", 10)], COMMUNES, Math.random)).toHaveLength(2);
    expect(tirerLesBetesDeNaissance(desCases(5, "jungle"), COMMUNES, Math.random)).toEqual([]);
    expect(tirerLesBetesDeNaissance([], COMMUNES, Math.random)).toEqual([]);
    expect(tirerLesBetesDeNaissance(desCases(5, "prairie"), new Map(), Math.random)).toEqual([]);
  });

  it("ne montre aucune Bête de naissance sur la carte : rien de la carte ne les lit", () => {
    const carte = [
      ...readdirSync("src/app/jeu/carte").map((f) => join("src/app/jeu/carte", f)),
      "src/monde/carte.ts",
      "src/monde/brouillard.ts",
      "src/monde/fiche.ts",
    ];
    for (const fichier of carte) expect(readFileSync(fichier, "utf8"), fichier).not.toMatch(/betes-de-naissance|bete_de_naissance/);
  });
});
