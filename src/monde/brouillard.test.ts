import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ABORDS_DU_FOYER_CASES } from "@/reglages";
import { abordsDuFoyer } from "./brouillard";
import { casesDesAnneaux, distance } from "./hex";

describe("une Case découverte le reste pour toujours (US-0441)", () => {
  /** Tout le code du jeu, de ses scripts et de ses migrations, hors des tests. */
  const sources = ["src", "scripts", "drizzle"].flatMap((dossier) =>
    readdirSync(join(process.cwd(), dossier), { recursive: true })
      .map(String)
      .filter((f) => /\.(ts|tsx|sql)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .map((f) => join(dossier, f)),
  );

  it("n'est effacée ni changée par aucune fonction du jeu, aucun script ni aucune migration", () => {
    expect(sources.length).toBeGreaterThan(100);
    const touche = [/\b(delete\s+from|update|truncate(\s+table)?)\s+"?case_decouverte\b/i, /\.(delete|update)\(\s*caseDecouverte\b/];
    expect(sources.filter((f) => touche.some((motif) => motif.test(readFileSync(join(process.cwd(), f), "utf8"))))).toEqual([]);
  });

  it("ne part qu'avec son Territoire : la Case, elle, ne peut pas être effacée tant qu'un Territoire l'a découverte", () => {
    const migration = readFileSync(join(process.cwd(), "drizzle/0045_brouillard.sql"), "utf8");
    expect(migration).toContain('FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade');
    expect(migration).toContain('FOREIGN KEY ("case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action');
  });
});

describe("une seule façon de découvrir des Cases (US-0442)", () => {
  /** Tout le code du jeu, de ses scripts et de ses migrations, hors des tests, et ce qu'il dit. */
  const sources = ["src", "scripts", "drizzle"].flatMap((dossier) =>
    readdirSync(join(process.cwd(), dossier), { recursive: true })
      .map(String)
      .filter((f) => /\.(ts|tsx|sql)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .map((f) => ({ fichier: join(dossier, f), texte: readFileSync(join(process.cwd(), dossier, f), "utf8") })),
  );

  it("n'écrit dans le brouillard que par decouvrir ; seule la migration 0045 l'a fait autrement, une fois, pour les Territoires déjà nés", () => {
    const ecrit = [/\binsert\s+into\s+"?case_decouverte\b/i, /\.insert\(\s*caseDecouverte\b/, /\bcopy\s+"?case_decouverte\b/i];
    expect(sources.filter(({ texte }) => ecrit.some((motif) => motif.test(texte))).map(({ fichier }) => fichier)).toEqual(["src/monde/brouillard.ts", "drizzle/0045_brouillard.sql"]);
    // Dans brouillard.ts, une seule instruction : celle de decouvrir.
    const brouillard = sources.find(({ fichier }) => fichier === "src/monde/brouillard.ts")!.texte;
    expect(brouillard.match(/insert\s+into\s+case_decouverte/gi)).toHaveLength(1);
  });

  it("découvre les abords du Foyer par elle à la naissance et à la bascule d'un Monde, et nulle part autrement", () => {
    const appels = sources.filter(({ fichier, texte }) => fichier !== "src/monde/brouillard.ts" && /\babordsDuFoyer\(/.test(texte));
    expect(appels.map(({ fichier }) => fichier).sort()).toEqual(["src/chefs/chef.ts", "src/monde/bascule.ts"]);
    for (const { fichier, texte } of appels) {
      const lignes = texte.split("\n").filter((l) => /\babordsDuFoyer\(/.test(l));
      for (const ligne of lignes) expect(ligne, fichier).toMatch(/\bawait decouvrir\(client, [^,]+, abordsDuFoyer\(/);
    }
  });
});

describe("les abords d'un Foyer (US-0436)", () => {
  it(`sont les Cases à ${ABORDS_DU_FOYER_CASES} Cases du Foyer ou moins, lui compris, et elles seules`, () => {
    const foyer = { q: 37, r: -52 };
    const abords = abordsDuFoyer(foyer);
    // Un hexagone de rayon 4 : 1 + 6 + 12 + 18 + 24 Cases.
    expect(abords).toHaveLength(1 + 3 * ABORDS_DU_FOYER_CASES * (ABORDS_DU_FOYER_CASES + 1));
    expect(new Set(abords.map((c) => `${c.q},${c.r}`)).size).toBe(abords.length);
    for (const c of abords) expect(distance(c, foyer)).toBeLessThanOrEqual(ABORDS_DU_FOYER_CASES);
    expect(abords).toContainEqual(foyer);
    // Toutes celles du voisinage à cette distance ou moins y sont, aucune au-delà.
    const voisinage = casesDesAnneaux(0, ABORDS_DU_FOYER_CASES + 2).map((c) => ({ q: c.q + foyer.q, r: c.r + foyer.r }));
    const attendues = voisinage.filter((c) => distance(c, foyer) <= ABORDS_DU_FOYER_CASES);
    expect([...abords].sort((a, b) => a.q - b.q || a.r - b.r)).toEqual(attendues.sort((a, b) => a.q - b.q || a.r - b.r));
  });

  it("suivent le rayon demandé, et ne sont que le Foyer à 0", () => {
    expect(abordsDuFoyer({ q: 0, r: 0 }, 0)).toEqual([{ q: 0, r: 0 }]);
    expect(abordsDuFoyer({ q: -3, r: 8 }, 1)).toHaveLength(7);
    expect(abordsDuFoyer({ q: -3, r: 8 }, 2)).toHaveLength(19);
  });
});
