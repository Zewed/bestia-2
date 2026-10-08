import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lireJeu } from "./charger";
import { ESPECES, ESPECES_D_ESSAI, especesDEssaiPermises, lireDonnees, RARETES, type EntreeEspece } from "./jeux";

const essais = lireJeu(ESPECES_D_ESSAI);
const validees = lireJeu(ESPECES);
const raretes = lireJeu(RARETES);

/** Les identifiants des Espèces que lireDonnees lit, validées et d'essai. */
const especesLues = (lots: ReturnType<typeof lireDonnees>) =>
  lots.filter((l) => l.jeu.table === "espece").flatMap((l) => (l.entrees as EntreeEspece[]).map((e) => e.id));

/** Tous les fichiers de code sous `dossier`. */
function fichiersDeCode(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersDeCode(chemin);
    return /\.(ts|tsx|js|mjs|cjs|css|sql|json)$/.test(nom) ? [chemin] : [];
  });
}

describe("les Espèces d'essai (US-0924)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("couvrent chaque Rareté de commune à légendaire, jamais mythique, dans plusieurs Biomes dont l'eau", () => {
    const rang = new Map(raretes.map((r) => [r.id, r.rang]));
    expect(new Set(essais.map((e) => e.rarete))).toEqual(new Set(["commune", "peu_commune", "rare", "epique", "legendaire"]));
    expect(Math.max(...essais.map((e) => rang.get(e.rarete)!))).toBeLessThan(rang.get("mythique")!);
    const biomes = new Set(essais.map((e) => e.biome));
    expect(biomes.size).toBeGreaterThanOrEqual(4);
    expect(biomes).toContain("eau");
    expect(essais.filter((e) => e.biome === "eau").map((e) => e.rarete)).toEqual(expect.arrayContaining(["commune", "peu_commune", "rare"]));
    expect(essais.length).toBeGreaterThanOrEqual(12);
    expect(essais.length).toBeLessThanOrEqual(20);
  });

  it("donnent leurs mesures réelles, sans illustration, et chaque Biome où elles vivent a ses communes", () => {
    for (const e of essais) {
      expect(e.illustration, e.id).toBeUndefined();
      expect(e.source, e.id).toBeTruthy();
    }
    const avecCommunes = new Set([...validees, ...essais].filter((e) => e.rarete === "commune").map((e) => e.biome));
    for (const e of essais) expect(avecCommunes, `${e.id} : ${e.biome}`).toContain(e.biome);
  });

  it("sont plus rares à mesure qu'elles sont fortes, avec les Espèces validées : leur attaque, par le barème, suit la Rareté", () => {
    const rang = new Map(raretes.map((r) => [r.id, r.rang]));
    const attaque = (e: EntreeEspece) => ESPECES.colonnes(e).attaque as number;
    const toutes = [...validees, ...essais];
    for (const a of toutes) {
      for (const b of toutes) {
        if (rang.get(a.rarete)! < rang.get(b.rarete)!) expect(attaque(a), `${a.id} < ${b.id}`).toBeLessThan(attaque(b));
      }
    }
  });

  it("ne reprennent l'identifiant d'aucune Espèce validée", () => {
    const ids = new Set(validees.map((e) => e.id));
    expect(essais.filter((e) => ids.has(e.id))).toEqual([]);
  });

  it("se chargent en développement et dans les tests, jamais en ligne ni sur la base de production", () => {
    expect(especesDEssaiPermises({})).toBe(true);
    expect(especesDEssaiPermises({ VERCEL_ENV: "development" })).toBe(true);
    expect(especesDEssaiPermises({ VERCEL_ENV: "preview" })).toBe(false);
    expect(especesDEssaiPermises({ VERCEL_ENV: "production" })).toBe(false);
    expect(especesDEssaiPermises({}, true)).toBe(false);

    const ids = essais.map((e) => e.id);
    expect(especesLues(lireDonnees())).toEqual(expect.arrayContaining(ids));
    vi.stubEnv("VERCEL_ENV", "production");
    expect(especesLues(lireDonnees())).toEqual(validees.map((e) => e.id));
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(especesLues(lireDonnees())).toEqual(validees.map((e) => e.id));
  });

  it("arrête la mise en ligne si l'une reprend l'identifiant d'une Espèce validée", () => {
    const dossier = mkdtempSync(join(tmpdir(), "bestia-donnees-"));
    cpSync("donnees", dossier, { recursive: true });
    const chemin = join(dossier, ESPECES_D_ESSAI.fichier);
    writeFileSync(chemin, readFileSync(chemin, "utf8").replace(`id: ${essais[0].id}\n`, `id: ${validees[0].id}\n`));
    expect(() => lireDonnees(dossier, { essai: true })).toThrow(new RegExp(`${validees[0].id} : déjà une Espèce validée`));
    rmSync(dossier, { recursive: true, force: true });
  });

  it("se retirent en supprimant leur fichier : le reste des données se lit sans elles", () => {
    const dossier = mkdtempSync(join(tmpdir(), "bestia-donnees-"));
    cpSync("donnees", dossier, { recursive: true });
    rmSync(join(dossier, ESPECES_D_ESSAI.fichier));
    expect(especesLues(lireDonnees(dossier, { essai: true }))).toEqual(validees.map((e) => e.id));
    rmSync(dossier, { recursive: true, force: true });
  });

  it("ne sont nommées nulle part dans le code : aucun fichier ne dépend de l'une d'elles par son identifiant", () => {
    const code = [...fichiersDeCode("src"), ...fichiersDeCode("scripts"), ...fichiersDeCode("drizzle")].map((f) => ({ f, texte: readFileSync(f, "utf8") }));
    expect(code.length).toBeGreaterThan(100);
    for (const { id } of essais) {
      const cite = new RegExp(`["'\`]${id}["'\`]`);
      expect(code.filter(({ texte }) => cite.test(texte)).map(({ f }) => f), id).toEqual([]);
    }
  });
});
