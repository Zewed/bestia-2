import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COULEURS } from "@/app/controle/monde/CarteDuMonde";
import { casesDesAnneaux, type Coordonnees } from "@/monde/hex";
import { aLEcran, dessinerLaCarte, LARGEUR_DE_CASE, MOTIFS, vueSurLeFoyer, type Peinture, type Pinceau } from "./dessin";

type Point = { x: number; y: number };
/** Ce qu'un remplissage ou un trait a peint : sa couleur, son épaisseur, et ses tracés, chacun la liste de ses points. */
type Peint = { geste: "remplir" | "border"; couleur: string; epaisseur: number; traces: Point[][] };

/** Un pinceau qui retient ce qu'on lui fait dessiner : chaque effacement, et chaque remplissage ou trait avec ses tracés. */
function pinceauDEssai() {
  const effacements: number[][] = [];
  const peints: Peint[] = [];
  let traces: Point[][] = [];
  const pinceau: Pinceau = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    clearRect: (...valeurs) => void effacements.push(valeurs),
    beginPath: () => void (traces = []),
    moveTo: (x, y) => void traces.push([{ x, y }]),
    lineTo: (x, y) => void traces.at(-1)!.push({ x, y }),
    quadraticCurveTo: (_, __, x, y) => void traces.at(-1)!.push({ x, y }),
    // Un rond : son centre, et le point de son bord où il commence.
    arc: (x, y, rayon) => void traces.at(-1)!.push({ x, y }, { x: x + rayon, y }),
    closePath: () => {},
    fill: () => void peints.push({ geste: "remplir", couleur: String(pinceau.fillStyle), epaisseur: pinceau.lineWidth, traces }),
    stroke: () => void peints.push({ geste: "border", couleur: String(pinceau.strokeStyle), epaisseur: pinceau.lineWidth, traces }),
  };
  return { pinceau, effacements, peints };
}

/** Des Cases en colonnes, comme la carte les reçoit du serveur, toutes de la teinte `teinte` des teintes données. */
const enColonnes = (cases: Coordonnees[], teinte: (c: Coordonnees) => number = () => 0) => ({
  q: cases.map((c) => c.q),
  r: cases.map((c) => c.r),
  teinte: cases.map(teinte),
});
/** Le milieu d'un tracé : la moyenne de ses sommets. */
const milieu = (points: Point[]) => ({
  x: points.reduce((s, p) => s + p.x, 0) / points.length,
  y: points.reduce((s, p) => s + p.y, 0) / points.length,
});
const cle = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;
/** Des couleurs d'essai, nommées pour se reconnaître. */
const peinture = (fonds: string[]): Peinture => ({ fonds, bord: "bord", motifSombre: "encre", motifClair: "ivoire" });
/** Une teinte que la carte ne connaît pas : sans motif, pour regarder les hexagones seuls. */
const SANS_MOTIF = ["inconnue"];

describe("carte du Monde à l'ouverture (US-0417)", () => {
  const FOYER = { q: 31, r: -57 };

  it("place le Foyer au milieu de l'écran, ses voisines à une largeur de Case autour", () => {
    const vue = vueSurLeFoyer(FOYER, 1280, 720);
    expect(aLEcran(FOYER, vue)).toEqual({ x: 640, y: 360 });
    const est = aLEcran({ q: FOYER.q + 1, r: FOYER.r }, vue);
    expect(est.x - 640).toBeCloseTo(LARGEUR_DE_CASE, 9);
    expect(est.y).toBeCloseTo(360, 9);
    // Sur un téléphone aussi, au milieu de la place qu'on lui laisse.
    expect(aLEcran(FOYER, vueSurLeFoyer(FOYER, 375, 559))).toEqual({ x: 187.5, y: 279.5 });
  });

  it("dessine chaque Case en hexagone d'environ 28 px de large, pointe en haut, le Foyer au milieu", () => {
    const { pinceau, peints } = pinceauDEssai();
    const autour = casesDesAnneaux(0, 2).map((c) => ({ q: c.q + FOYER.q, r: c.r + FOYER.r }));
    dessinerLaCarte(pinceau, { teintes: SANS_MOTIF, cases: enColonnes(autour) }, vueSurLeFoyer(FOYER, 1280, 720), peinture(["blanc"]));
    const { traces } = peints[0];
    expect(traces).toHaveLength(autour.length);
    for (const trace of traces) {
      expect(trace).toHaveLength(6);
      const xs = trace.map((p) => p.x);
      const ys = trace.map((p) => p.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(LARGEUR_DE_CASE, 9);
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo((2 * LARGEUR_DE_CASE) / Math.sqrt(3), 9);
      // La pointe en haut : le premier sommet, au-dessus du milieu.
      expect(trace[0].x).toBeCloseTo(milieu(trace).x, 9);
      expect(trace[0].y).toBeLessThan(milieu(trace).y);
    }
    const auMilieu = traces.filter((t) => Math.abs(milieu(t).x - 640) < 1e-9 && Math.abs(milieu(t).y - 360) < 1e-9);
    expect(auMilieu).toHaveLength(1);
  });

  it("efface l'écran, remplit les Cases, puis trace leurs bords", () => {
    const { pinceau, effacements, peints } = pinceauDEssai();
    dessinerLaCarte(pinceau, { teintes: SANS_MOTIF, cases: enColonnes(casesDesAnneaux(0, 3)) }, vueSurLeFoyer({ q: 0, r: 0 }, 800, 600), peinture(["blanc"]));
    expect(effacements).toEqual([[0, 0, 800, 600]]);
    expect(peints.map((p) => `${p.geste} ${p.couleur}`)).toEqual(["remplir blanc", "border bord"]);
  });

  it("ne dessine que les Cases à l'écran ou qui le touchent : toutes sont là, sans en dessiner 10 981", () => {
    const { pinceau, peints } = pinceauDEssai();
    const monde = casesDesAnneaux(0, 60);
    const vue = vueSurLeFoyer(FOYER, 1280, 720);
    dessinerLaCarte(pinceau, { teintes: SANS_MOTIF, cases: enColonnes(monde) }, vue, peinture(["blanc"]));
    // Chaque Case dont un bout tombe dans l'écran est dessinée ; aucune qui en est loin.
    const touchent = monde.filter((c) => {
      const { x, y } = aLEcran(c, vue);
      return x > -LARGEUR_DE_CASE / 2 && x < 1280 + LARGEUR_DE_CASE / 2 && y > -vue.rayon && y < 720 + vue.rayon;
    });
    const dessinees = new Set(peints[0].traces.map((t) => cle(milieu(t))));
    for (const c of touchent) expect(dessinees).toContain(cle(aLEcran(c, vue)));
    expect(peints[0].traces.length).toBeLessThan(touchent.length * 1.2);
  });
});

describe("chaque Case selon son Biome (US-0418)", () => {
  const TEINTES = ["prairie", "foret", "jungle", "savane", "desert", "montagne", "toundra", "banquise", "cote", "lac", "riviere", "mer"];
  const vue = vueSurLeFoyer({ q: 0, r: 0 }, 800, 600);

  it("remplit chaque Case de la couleur de sa teinte, d'un seul geste par teinte", () => {
    const { pinceau, peints } = pinceauDEssai();
    const cases = casesDesAnneaux(0, 4);
    // Une Case sur deux en prairie, les autres en mer, selon leur q.
    const teinte = (c: Coordonnees) => Math.abs(c.q) % 2;
    dessinerLaCarte(pinceau, { teintes: ["prairie", "mer"], cases: enColonnes(cases, teinte) }, vue, peinture(["vert", "bleu"]));
    const fonds = peints.filter((p) => p.geste === "remplir" && ["vert", "bleu"].includes(p.couleur));
    expect(fonds.map((p) => p.couleur)).toEqual(["vert", "bleu"]);
    for (const [i, fond] of fonds.entries()) {
      expect(fond.traces.every((t) => t.length === 6)).toBe(true);
      expect(new Set(fond.traces.map((t) => cle(milieu(t))))).toEqual(new Set(cases.filter((c) => teinte(c) === i).map((c) => cle(aLEcran(c, vue)))));
    }
  });

  it("a un motif pour chacun des huit Biomes de terre et chacune des quatre eaux", () => {
    expect(Object.keys(MOTIFS).sort()).toEqual([...TEINTES].sort());
  });

  it("pose sur chaque Case, par-dessus sa couleur, le motif de sa teinte, au milieu de la Case : douze motifs différents", () => {
    const signatures = TEINTES.map((teinte) => {
      const { pinceau, peints } = pinceauDEssai();
      dessinerLaCarte(pinceau, { teintes: [teinte], cases: enColonnes([{ q: 0, r: 0 }]) }, vue, peinture(["fond"]));
      expect(peints[0]).toMatchObject({ geste: "remplir", couleur: "fond" });
      const motif = peints.slice(1, -1);
      expect(motif.length).toBeGreaterThan(0);
      for (const p of motif) {
        // Sombre sur les teintes claires, clair sur les sombres : jamais une autre couleur.
        expect(["encre", "ivoire"]).toContain(p.couleur);
        // Le motif reste dans sa Case, loin de ses bords.
        for (const point of p.traces.flat()) expect(Math.hypot(point.x - 400, point.y - 300)).toBeLessThan(0.62 * vue.rayon);
      }
      return JSON.stringify(motif.map((p) => [p.geste, p.couleur, p.traces.map((t) => t.map(cle))]));
    });
    expect(new Set(signatures).size).toBe(TEINTES.length);
  });

  it("met les motifs d'une même teinte d'un seul geste, à la même place dans chaque Case", () => {
    const { pinceau, peints } = pinceauDEssai();
    const cases = casesDesAnneaux(0, 1);
    dessinerLaCarte(pinceau, { teintes: ["foret"], cases: enColonnes(cases) }, vue, peinture(["vert"]));
    const motif = peints.slice(1, -1);
    expect(motif).toHaveLength(1);
    expect(motif[0].traces.length % cases.length).toBe(0);
  });

  it("trace par-dessus tout une légère bordure entre les Cases, d'un pixel", () => {
    const { pinceau, peints } = pinceauDEssai();
    const cases = casesDesAnneaux(0, 2);
    dessinerLaCarte(pinceau, { teintes: ["prairie", "foret"], cases: enColonnes(cases, (c) => (c.r > 0 ? 1 : 0)) }, vue, peinture(["vert", "sapin"]));
    const bord = peints.at(-1)!;
    expect(bord).toMatchObject({ geste: "border", couleur: "bord", epaisseur: 1 });
    expect(bord.traces.map((t) => cle(milieu(t))).sort()).toEqual(cases.map((c) => cle(aLEcran(c, vue))).sort());
  });
});

describe("couleurs des Biomes sur la carte (US-0418)", () => {
  /** Chaque couleur oklch de la palette, par son nom : [clarté, chroma, teinte en degrés]. */
  const palette = new Map(
    [...readFileSync(join(process.cwd(), "src/styles/palette.css"), "utf8").matchAll(/(--[\w-]+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\);/g)].map(([, nom, l, c, h]) => [
      nom,
      [Number(l), Number(c), Number(h)],
    ]),
  );
  /** La couleur d'une teinte sur la carte, celle de la page de contrôle du Monde, en coordonnées OKLab. */
  const oklab = (teinte: string) => {
    const [l, c, h] = palette.get(COULEURS[teinte].match(/var\((--[\w-]+)\)/)![1])!;
    return [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  };

  it("donne à chaque teinte une couleur qui se distingue d'un coup d'œil de toutes les autres", () => {
    const teintes = Object.keys(MOTIFS);
    for (const [i, a] of teintes.entries()) {
      for (const b of teintes.slice(i + 1)) {
        const ecart = Math.hypot(...oklab(a).map((v, k) => v - oklab(b)[k]));
        expect(ecart, `${a} et ${b}`).toBeGreaterThanOrEqual(0.07);
      }
    }
  });
});
