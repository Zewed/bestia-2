import { describe, expect, it } from "vitest";
import { casesDesAnneaux, type Coordonnees } from "@/monde/hex";
import { aLEcran, dessinerLaCarte, LARGEUR_DE_CASE, vueSurLeFoyer, type Pinceau } from "./dessin";

/** Un pinceau qui retient ce qu'on lui fait dessiner : chaque tracé (ses points), et chaque remplissage ou trait avec sa couleur. */
function pinceauDEssai() {
  const traces: { x: number; y: number }[][] = [];
  const gestes: string[] = [];
  const pinceau: Pinceau = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    clearRect: (x, y, l, h) => void gestes.push(`effacer ${x} ${y} ${l} ${h}`),
    beginPath: () => void gestes.push("commencer"),
    moveTo: (x, y) => void traces.push([{ x, y }]),
    lineTo: (x, y) => void traces.at(-1)!.push({ x, y }),
    closePath: () => {},
    fill: () => void gestes.push(`remplir ${pinceau.fillStyle}`),
    stroke: () => void gestes.push(`border ${pinceau.strokeStyle} ${pinceau.lineWidth}`),
  };
  return { pinceau, traces, gestes };
}

/** Des Cases en colonnes, comme la carte les reçoit du serveur. */
const enColonnes = (cases: Coordonnees[]) => ({ q: cases.map((c) => c.q), r: cases.map((c) => c.r) });
/** Le milieu d'un tracé : la moyenne de ses sommets. */
const milieu = (points: { x: number; y: number }[]) => ({
  x: points.reduce((s, p) => s + p.x, 0) / points.length,
  y: points.reduce((s, p) => s + p.y, 0) / points.length,
});

describe("carte du Monde à l'ouverture (US-0417)", () => {
  const FOYER = { q: 31, r: -57 };
  const COULEURS = { case: "blanc", bord: "gris" };

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
    const { pinceau, traces } = pinceauDEssai();
    const autour = casesDesAnneaux(0, 2).map((c) => ({ q: c.q + FOYER.q, r: c.r + FOYER.r }));
    dessinerLaCarte(pinceau, enColonnes(autour), vueSurLeFoyer(FOYER, 1280, 720), COULEURS);
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

  it("efface l'écran, puis remplit les Cases et trace leurs bords d'un seul geste chacun", () => {
    const { pinceau, gestes } = pinceauDEssai();
    dessinerLaCarte(pinceau, enColonnes(casesDesAnneaux(0, 3)), vueSurLeFoyer({ q: 0, r: 0 }, 800, 600), COULEURS);
    expect(gestes).toEqual(["effacer 0 0 800 600", "commencer", "remplir blanc", "border gris 1"]);
  });

  it("ne dessine que les Cases à l'écran ou qui le touchent : toutes sont là, sans en dessiner 10 981", () => {
    const { pinceau, traces } = pinceauDEssai();
    const monde = casesDesAnneaux(0, 60);
    const vue = vueSurLeFoyer(FOYER, 1280, 720);
    dessinerLaCarte(pinceau, enColonnes(monde), vue, COULEURS);
    // Chaque Case dont un bout tombe dans l'écran est dessinée ; aucune qui en est loin.
    const touchent = monde.filter((c) => {
      const { x, y } = aLEcran(c, vue);
      return x > -LARGEUR_DE_CASE / 2 && x < 1280 + LARGEUR_DE_CASE / 2 && y > -vue.rayon && y < 720 + vue.rayon;
    });
    const dessinees = new Set(traces.map((t) => `${Math.round(milieu(t).x)},${Math.round(milieu(t).y)}`));
    for (const c of touchent) expect(dessinees).toContain(`${Math.round(aLEcran(c, vue).x)},${Math.round(aLEcran(c, vue).y)}`);
    expect(traces.length).toBeLessThan(touchent.length * 1.2);
  });
});
