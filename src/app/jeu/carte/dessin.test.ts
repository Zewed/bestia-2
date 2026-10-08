import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COULEURS } from "@/app/controle/monde/CarteDuMonde";
import { casesDesAnneaux, type Coordonnees } from "@/monde/hex";
import { aLEcran, dessinerLaCarte, LARGEUR_DE_CASE, MOTIFS, tailleDuRepere, vueSurLeFoyer, type Peinture, type Pinceau } from "./dessin";

type Point = { x: number; y: number };
/** Ce qu'un remplissage ou un trait a peint : sa couleur, son épaisseur, et ses tracés, chacun la liste de ses points. */
type Peint = { geste: "remplir" | "border"; couleur: string; epaisseur: number; traces: Point[][] };

/**
 * Un pinceau qui retient ce qu'on lui fait dessiner : chaque effacement, chaque remplissage ou trait avec ses
 * tracés, et chaque image posée avec la découpe (les tracés) qui la borne.
 */
function pinceauDEssai() {
  const effacements: number[][] = [];
  const peints: Peint[] = [];
  const images: { image: unknown; valeurs: number[]; decoupe: Point[][] | null }[] = [];
  let traces: Point[][] = [];
  let decoupe: Point[][] | null = null;
  const pinceau: Pinceau = {
    save: () => {},
    restore: () => void (decoupe = null),
    clip: () => void (decoupe = traces),
    drawImage: (image: unknown, ...valeurs: number[]) => void images.push({ image, valeurs, decoupe }),
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
  } as Pinceau;
  return { pinceau, effacements, peints, images };
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
const peinture = (fonds: string[]): Peinture => ({ fonds, bord: "bord", motifSombre: "encre", motifClair: "ivoire", encre: "Encre", repere: "citron" });
/** Une teinte que la carte ne connaît pas : sans motif, pour regarder les hexagones seuls. */
const SANS_MOTIF = ["inconnue"];
/** Un Foyer loin de l'écran, sans autre Foyer : pour regarder les Cases seules. */
const FOYER_LOIN = { foyer: { q: 60, r: -30 }, foyers: [] };

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
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: SANS_MOTIF, cases: enColonnes(autour) }, vueSurLeFoyer(FOYER, 1280, 720), peinture(["blanc"]));
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
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: SANS_MOTIF, cases: enColonnes(casesDesAnneaux(0, 3)) }, vueSurLeFoyer({ q: 0, r: 0 }, 800, 600), peinture(["blanc"]));
    expect(effacements).toEqual([[0, 0, 800, 600]]);
    expect(peints.map((p) => `${p.geste} ${p.couleur}`)).toEqual(["remplir blanc", "border bord"]);
  });

  it("ne dessine que les Cases à l'écran ou qui le touchent : toutes sont là, sans en dessiner 10 981", () => {
    const { pinceau, peints } = pinceauDEssai();
    const monde = casesDesAnneaux(0, 60);
    const vue = vueSurLeFoyer(FOYER, 1280, 720);
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: SANS_MOTIF, cases: enColonnes(monde) }, vue, peinture(["blanc"]));
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
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: ["prairie", "mer"], cases: enColonnes(cases, teinte) }, vue, peinture(["vert", "bleu"]));
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
      dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: [teinte], cases: enColonnes([{ q: 0, r: 0 }]) }, vue, peinture(["fond"]));
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
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: ["foret"], cases: enColonnes(cases) }, vue, peinture(["vert"]));
    const motif = peints.slice(1, -1);
    expect(motif).toHaveLength(1);
    expect(motif[0].traces.length % cases.length).toBe(0);
  });

  it("trace par-dessus tout une légère bordure entre les Cases, d'un pixel", () => {
    const { pinceau, peints } = pinceauDEssai();
    const cases = casesDesAnneaux(0, 2);
    dessinerLaCarte(pinceau, { ...FOYER_LOIN, teintes: ["prairie", "foret"], cases: enColonnes(cases, (c) => (c.r > 0 ? 1 : 0)) }, vue, peinture(["vert", "sapin"]));
    const bord = peints.at(-1)!;
    expect(bord).toMatchObject({ geste: "border", couleur: "bord", epaisseur: 1 });
    expect(bord.traces.map((t) => cle(milieu(t))).sort()).toEqual(cases.map((c) => cle(aLEcran(c, vue))).sort());
  });
});

describe("son Foyer sur la carte (US-0419)", () => {
  const FOYER = { q: -47, r: 56 };
  const VOISINS = [
    { q: -43, r: 55 },
    { q: -50, r: 57 },
  ];
  const vue = vueSurLeFoyer(FOYER, 800, 600);
  const autour = casesDesAnneaux(0, 6).map((c) => ({ q: c.q + FOYER.q, r: c.r + FOYER.r }));
  const carte = { teintes: ["prairie"], cases: enColonnes(autour), foyer: FOYER, foyers: VOISINS };
  /** L'illustration de la hutte, telle que le navigateur l'a chargée : 384 × 256 pixels. */
  const HUTTE = { image: "hutte" as unknown as CanvasImageSource, largeur: 384, hauteur: 256 };
  const hexagones = (p: Peint) => p.traces.every((t) => t.length === 6);

  it("montre sur la Case du Foyer l'illustration de la hutte du chef, découpée à la forme de la Case", () => {
    const { pinceau, images } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, vue, peinture(["vert"]), HUTTE);
    expect(images).toHaveLength(1);
    const [{ image, valeurs, decoupe }] = images;
    expect(image).toBe("hutte");
    // Découpée à l'hexagone du Foyer, au milieu de l'écran.
    expect(decoupe).toHaveLength(1);
    expect(decoupe![0]).toHaveLength(6);
    expect(cle(milieu(decoupe![0]))).toBe("400,300");
    // Posée sur toute la Case : un rectangle de sa largeur et de sa hauteur, autour de son centre…
    const [sx, sy, sl, sh, x, y, l, h] = valeurs;
    expect(x + l / 2).toBeCloseTo(400, 9);
    expect(y + h / 2).toBeCloseTo(300, 9);
    expect(l).toBeCloseTo(LARGEUR_DE_CASE, 9);
    expect(h).toBeCloseTo(2 * vue.rayon, 9);
    // … recadrée dans l'image autour de la hutte, aux proportions de la Case : rien d'étiré.
    expect(sx).toBeGreaterThan(0);
    expect(sy).toBeGreaterThanOrEqual(0);
    expect(sx + sl).toBeLessThan(384);
    expect(sy + sh).toBeLessThanOrEqual(256);
    expect(sl / sh).toBeCloseTo(l / h, 9);
  });

  it("marque son Foyer d'un repère citron cerné d'Encre, la pointe sur la Case et la tête au-dessus, par-dessus tout", () => {
    const { pinceau, peints } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, vue, peinture(["vert"]), HUTTE);
    expect(peints.slice(-3).map((p) => `${p.geste} ${p.couleur}`)).toEqual(["remplir citron", "border Encre", "remplir Encre"]);
    const [repere, contour, oeil] = peints.slice(-3);
    expect(contour.traces).toBe(repere.traces);
    const points = repere.traces.flat();
    // La pointe dans la Case du Foyer, la tête au-dessus de la Case ; l'œil d'Encre au milieu de la tête.
    expect(points.some((p) => Math.hypot(p.x - 400, p.y - 300) < 0.6 * vue.rayon)).toBe(true);
    expect(Math.min(...points.map((p) => p.y))).toBeLessThan(300 - vue.rayon);
    expect(oeil.traces.flat().every((p) => Math.abs(p.x - 400) < tailleDuRepere(vue.rayon))).toBe(true);
    // La Case du Foyer est cernée d'Encre, sous le repère.
    expect(peints.filter((p) => p.geste === "border" && p.couleur === "Encre" && hexagones(p)).map((p) => p.traces.map((t) => cle(milieu(t))))).toEqual([["400,300"]]);
  });

  it("marque son Foyer même avant que la hutte soit chargée", () => {
    const { pinceau, peints, images } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, vue, peinture(["vert"]), null);
    expect(images).toEqual([]);
    expect(peints.filter((p) => p.couleur === "citron")).toHaveLength(1);
  });

  it("grossit le repère par rapport aux Cases quand elles rapetissent, jamais sous 9 pixels, pour le voir à tout zoom", () => {
    const rayons = [40, 16, 8, 4, 2];
    for (const rayon of rayons) expect(tailleDuRepere(rayon)).toBeGreaterThanOrEqual(9);
    const parCase = rayons.map((rayon) => tailleDuRepere(rayon) / rayon);
    for (let i = 1; i < parCase.length; i++) expect(parCase[i]).toBeGreaterThan(parCase[i - 1]);
    // Avec de grandes Cases, il grandit avec elles.
    expect(tailleDuRepere(40)).toBeGreaterThan(tailleDuRepere(16));
    // Sur une carte vue de loin, des Cases de 3 pixels de rayon : le repère en couvre plusieurs.
    const { pinceau, peints } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, { ...vue, rayon: 3 }, peinture(["vert"]), HUTTE);
    const ys = peints.find((p) => p.couleur === "citron")!.traces.flat().map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(4 * 3);
  });

  it("marque les Foyers des autres joueurs d'un petit hexagone d'Encre, sans hutte ni repère : ils ne se confondent pas avec le sien", () => {
    const { pinceau, peints, images } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, vue, peinture(["vert"]), HUTTE);
    const autres = peints.filter((p) => p.geste === "remplir" && p.couleur === "Encre" && hexagones(p));
    expect(autres).toHaveLength(1);
    expect(autres[0].traces.map((t) => cle(milieu(t))).sort()).toEqual(VOISINS.map((c) => cle(aLEcran(c, vue))).sort());
    for (const t of autres[0].traces) expect(Math.max(...t.map((p) => p.x)) - Math.min(...t.map((p) => p.x))).toBeLessThan(LARGEUR_DE_CASE / 2);
    // La hutte et le repère ne vont qu'au Foyer du joueur.
    expect(images.map((i) => cle(milieu(i.decoupe![0])))).toEqual(["400,300"]);
    expect(peints.filter((p) => p.couleur === "citron")).toHaveLength(1);
  });

  it("ne marque pas un Foyer loin de l'écran", () => {
    const { pinceau, peints, images } = pinceauDEssai();
    dessinerLaCarte(pinceau, carte, vueSurLeFoyer({ q: 0, r: 0 }, 800, 600), peinture(["vert"]), HUTTE);
    expect(images).toEqual([]);
    expect(peints.filter((p) => ["citron", "Encre"].includes(p.couleur))).toEqual([]);
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
