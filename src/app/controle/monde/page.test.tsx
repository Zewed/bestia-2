import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emplacementsDeNaissance } from "@/monde/foyers";
import { genererLeMonde } from "@/monde/generer";
import { anneau, casesDesAnneaux } from "@/monde/hex";
import type { CaseDeCarte } from "./bilan";

const entetes = vi.hoisted(() => ({ authorization: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(entetes.authorization ? { authorization: entetes.authorization } : {}),
}));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("@/donnees/en-base", () => ({
  biomesEnBase: async () => [
    { id: "prairie", nom: "Prairie", variantes: [], production: [] },
    { id: "desert", nom: "Désert", variantes: [], production: [] },
    {
      id: "eau",
      nom: "Eau",
      production: [],
      variantes: [
        { id: "cote", nom: "Côte" },
        { id: "lac", nom: "Lac" },
        { id: "riviere", nom: "Rivière" },
        { id: "mer", nom: "Mer" },
      ],
    },
  ],
}));
const base = vi.hoisted(() => ({ mondesEnBase: vi.fn(), mondeEnBase: vi.fn() }));
vi.mock("./en-base", () => base);

import { proxy } from "@/proxy";
import ControleDuMonde from "./page";

const MOT_DE_PASSE = "mot-de-passe-d-essai";
const ouvrir = (recherche: Record<string, string> = {}) =>
  ControleDuMonde({ params: Promise.resolve({}), searchParams: Promise.resolve(recherche) } as PageProps<"/controle/monde">);
/** La page en HTML, ses espaces fines (« 2 070 ») rendues en espaces simples. */
const afficher = async (recherche: Record<string, string> = {}) => renderToStaticMarkup(await ouvrir(recherche)).replaceAll("\u202f", " ");
const connecte = () => {
  entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
};

/** Un petit Monde en base de 6 anneaux, sa Couronne sur les 2 derniers : de la prairie, un désert contre une toundra, un Foyer. */
const PETIT: CaseDeCarte[] = casesDesAnneaux(0, 6).map((c) => ({
  ...c,
  anneau: anneau(c),
  couronne: anneau(c) > 4,
  coeur: anneau(c) < 1,
  biome: c.q === 1 && c.r === 0 ? "desert" : c.q === 2 && c.r === 0 ? "toundra" : "prairie",
  variante: null,
  possedee: c.q === 0 && c.r === -6,
  foyer: c.q === 0 && c.r === -6,
}));

describe("page de contrôle du Monde (US-0412)", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", MOT_DE_PASSE);
    base.mondesEnBase.mockResolvedValue([
      { id: 1, nom: "Aube", graine: 478517082, cases: 2070 },
      { id: 4, nom: "Essai", graine: 12345, cases: 10_981 },
    ]);
    base.mondeEnBase.mockResolvedValue(null);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    entetes.authorization = null;
  });

  it("est inaccessible aux joueurs : le navigateur demande le mot de passe, et la page répond « introuvable » sans lui", async () => {
    const reponse = await proxy(new NextRequest("https://bestia.test/controle/monde?graine=12345"));
    expect(reponse?.status).toBe(401);
    await expect(ouvrir({ graine: "12345" })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("propose une graine à générer, et les Mondes en base à afficher", async () => {
    connecte();
    const html = await afficher();
    expect(html).toMatch(/<input(?=[^>]*name="graine")[^>]*aria-label="Graine"/);
    expect(html).toMatch(/<button type="submit"[^>]*>Générer<\/button>/);
    expect(html).toContain("Mondes en base · 2");
    expect(html).toMatch(/<a href="\/controle\/monde\?monde=1">Aube<\/a> <span[^>]*>graine 478517082 · 2 070 Cases<\/span>/);
    expect(html).toContain('href="/controle/monde?monde=4"');
    expect(html).not.toContain("<svg");
  });

  describe("un Monde généré à la volée", () => {
    const monde = genererLeMonde({ rayon: 60, anneaux: 6, rayonCoeur: 8, graine: 12345 });

    it("montre le Monde entier, sans brouillard, une forme par Biome et par eau, sans rien enregistrer", async () => {
      connecte();
      const html = await afficher({ graine: "12345" });
      expect(html).toContain("Graine 12345 · à la volée");
      expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="Le Monde, Graine 12345 · à la volée, 10 981 Cases"/);
      const teintes = [...html.matchAll(/<path data-teinte="([a-z]+)" d="([^"]+)"/g)];
      expect(teintes.map((t) => t[1]).sort()).toEqual(["banquise", "cote", "desert", "foret", "jungle", "lac", "mer", "montagne", "prairie", "riviere", "savane", "toundra"]);
      // Chaque Case du Monde est dessinée une fois : un hexagone par Case.
      expect(teintes.reduce((s, t) => s + t[2].split("M").length - 1, 0)).toBe(10_981);
      expect(html).toContain("fill:var(--biome-prairie)");
      expect(base.mondeEnBase).not.toHaveBeenCalled();
    });

    it("cerne la Couronne et le Cœur sauvage", async () => {
      connecte();
      const html = await afficher({ graine: "12345" });
      const bord = (nom: string) => html.match(new RegExp(`data-bord="${nom}"[^>]*d="([^"]*)"`))?.[1] ?? "";
      // Le bord intérieur et le bord extérieur de la Couronne : 2 × 6 × 55 et 2 × 6 × 60 côtés de Case, plus les coins.
      expect(bord("couronne").split("M").length - 1).toBe(6 * (2 * 55 - 1) + 6 * (2 * 60 + 1));
      expect(bord("coeur").split("M").length - 1).toBe(6 * (2 * 7 + 1));
      expect(html).toMatch(/Couronne<span[^>]*>2 070<\/span>/);
      expect(html).toMatch(/Cœur sauvage<span[^>]*>169<\/span>/);
    });

    it("affiche la part de chaque Biome, le nombre de lacs et de rivières, et marque chaque Case de naissance libre", async () => {
      connecte();
      const html = await afficher({ graine: "12345" });
      const terre = monde.filter((c) => c.biome !== "eau").length;
      const prairie = monde.filter((c) => c.biome === "prairie").length / terre;
      expect(html).toContain(`Prairie<span class="${html.match(/Prairie<span class="([^"]+)"/)?.[1]}">${(100 * prairie).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</span>`);
      expect(html).toContain("Lacs : 8 · Rivières : 12");
      expect(html).toMatch(/Mer<span[^>]*>[\d ]+ Cases<\/span>/);
      const emplacements = emplacementsDeNaissance(monde);
      expect(html.match(/<circle /g)).toHaveLength(emplacements.length);
      expect(html).toMatch(new RegExp(`Cases de naissance libres<span class="[^"]*">${emplacements.length}</span>`));
      expect(html).not.toMatch(/Cases de naissance libres<span class="[^"]*alerte/);
    });

    it("dit qu'il n'y a aucun voisinage interdit", async () => {
      connecte();
      expect(await afficher({ graine: "12345" })).toMatch(/Voisinages interdits<\/h3><p>Aucun<\/p>/);
    });

    it("refuse une graine qui n'en est pas une, en le disant sous le champ", async () => {
      connecte();
      const html = await afficher({ graine: "abc" });
      expect(html).toContain("Une graine est un nombre entier de 0 à 4294967295, pas « abc ».");
      expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
      expect(html).not.toContain("<svg");
    });
  });

  describe("un Monde en base", () => {
    it("l'affiche à partir de ses Cases enregistrées, avec ses Foyers et ses Cases de naissance encore libres", async () => {
      connecte();
      base.mondeEnBase.mockResolvedValue({ nom: "Aube", graine: 478517082, cases: PETIT });
      const html = await afficher({ monde: "1" });
      expect(base.mondeEnBase).toHaveBeenCalledWith(expect.anything(), 1);
      expect(html).toContain("Aube · graine 478517082 · en base");
      expect(html).toMatch(/<a(?=[^>]*aria-current="page")[^>]*href="\/controle\/monde\?monde=1"[^>]*>Aube<\/a>/);
      expect(html).toMatch(/Foyers<span[^>]*>1<\/span>/);
      const libres = emplacementsDeNaissance(PETIT, [{ q: 0, r: -6 }]);
      expect(html.match(/<circle /g)).toHaveLength(libres.length);
      // Bien moins de 90 places : le nombre passe en couleur de danger.
      expect(html).toMatch(new RegExp(`Cases de naissance libres<span class="[^"]*alerte[^"]*">${libres.length}</span>`));
    });

    it("signale les voisinages interdits qu'il y trouve", async () => {
      connecte();
      base.mondeEnBase.mockResolvedValue({ nom: "Aube", graine: 478517082, cases: PETIT });
      const html = await afficher({ monde: "1" });
      expect(html).toMatch(/Voisinages interdits<\/h3><ul class="[^"]*"><li>1,0 desert · 2,0 toundra<\/li><\/ul>/);
    });

    it("dit quand le Monde demandé n'existe pas", async () => {
      connecte();
      const html = await afficher({ monde: "99" });
      expect(html).toContain("Aucun Monde n° 99 en base.");
      expect(html).not.toContain("<svg");
    });
  });
});
