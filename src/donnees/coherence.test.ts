import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { lireJeu } from "./charger";
import { ESPECES, lireDonnees, type EntreeEspece } from "./jeux";

type Entree = Record<string, unknown>;

/** Une copie du dossier donnees/ où un fichier a subi une erreur de saisie. */
function donneesAvec(fichier: string, modifier: (entrees: Entree[]) => Entree[]): string {
  const dossier = mkdtempSync(join(tmpdir(), "bestia-donnees-"));
  cpSync("donnees", dossier, { recursive: true });
  const chemin = join(dossier, fichier);
  writeFileSync(chemin, stringify(modifier(parse(readFileSync(chemin, "utf8")))));
  return dossier;
}

const premiereEspece = (changement: Entree) => (entrees: Entree[]) => entrees.map((e, i) => (i === 0 ? { ...e, ...changement } : e));

describe("cohérence des données de référence", () => {
  it("les fichiers de donnees/ passent tous les contrôles de la mise en ligne", () => {
    expect(() => lireDonnees()).not.toThrow();
  });

  it("aucune caractéristique chiffrée d'une Espèce n'est négative", () => {
    for (const e of lireJeu(ESPECES) as EntreeEspece[]) {
      for (const [champ, valeur] of Object.entries(ESPECES.colonnes(e))) {
        if (typeof valeur === "number") expect(valeur, `${e.id} · ${champ}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it.each([
    ["une Espèce dont le Biome n'existe pas", premiereEspece({ biome: "lune" }), /Biome inconnu « lune »/],
    ["une Espèce dont la Rareté n'existe pas", premiereEspece({ rarete: "introuvable" }), /Rareté inconnue « introuvable »/],
    ["une Espèce au régime inconnu", premiereEspece({ regime: "frugivore" }), /régime/],
    ["une Espèce à la vitesse négative", premiereEspece({ vitesse: -13 }), /vitesse doit être positif/],
    ["une Espèce qui a deux Rôles", premiereEspece({ role: ["nourricier", "eclaireur"] }), /\(role\)/],
  ])("arrête la mise en ligne pour %s", (_, modifier, message) => {
    expect(() => lireDonnees(donneesAvec("especes.yaml", modifier))).toThrow(message);
  });

  /** US-0407 : la liste jamais_a_cote_de d'un Biome de biomes.yaml, changée. */
  const voisinages = (id: string, jamais: unknown) => (entrees: Entree[]) => entrees.map((e) => (e.id === id ? { ...e, jamais_a_cote_de: jamais } : e));

  it.each([
    ["un voisinage interdit avec un Biome qui n'existe pas", voisinages("banquise", ["desert", "jungle", "savane", "lune"]), /banquise : Biome inconnu « lune » dans jamais_a_cote_de/],
    ["un Biome interdit à côté de lui-même", voisinages("prairie", ["prairie"]), /prairie : un Biome ne peut pas être interdit à côté de lui-même/],
    ["un voisinage interdit écrit d'un seul côté", voisinages("prairie", ["foret"]), /prairie : jamais à côté de foret, mais foret ne le dit pas/],
    ["une liste qui n'en est pas une", voisinages("desert", "jungle"), /desert : jamais_a_cote_de doit être une liste de Biomes/],
  ])("arrête la mise en ligne pour %s (US-0407)", (_, modifier, message) => {
    expect(() => lireDonnees(donneesAvec("biomes.yaml", modifier))).toThrow(message);
  });
});
