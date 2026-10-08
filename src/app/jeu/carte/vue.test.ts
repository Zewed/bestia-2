import { describe, expect, it } from "vitest";
import { anneau, casesDesAnneaux, type Coordonnees } from "@/monde/hex";
import { CARTE_DEBORD_CASES, CARTE_PAS_CLAVIER_CASES } from "@/reglages";
import { aLEcran, vueSurLeFoyer, type Vue } from "./dessin";
import { avancer, borner, deplacer, limiteDeLaCarte } from "./vue";

const FOYER = { q: 31, r: -57 };
/** La carte d'un écran d'ordinateur ouverte sur le Foyer. */
const OUVERTE = vueSurLeFoyer(FOYER, 800, 600);
/** Des Cases en colonnes, comme la carte les reçoit du serveur. */
const carteDe = (cases: Coordonnees[]) => ({ teintes: ["prairie"], cases: { q: cases.map((c) => c.q), r: cases.map((c) => c.r), teinte: cases.map(() => 0) }, foyer: FOYER, foyers: [] });
/** Une vue posée sur un point quelconque, en Cases non entières. */
const sur = (milieu: Coordonnees): Vue => ({ ...OUVERTE, milieu });

describe("glisser la carte (US-0420)", () => {
  it("la fait suivre le pointeur : chaque Case se déplace d'autant que lui, à l'écran", () => {
    const vue = deplacer(OUVERTE, 37, -12, 60);
    for (const c of [FOYER, { q: 32, r: -57 }, { q: 25, r: -50 }]) {
      const [avant, apres] = [aLEcran(c, OUVERTE), aLEcran(c, vue)];
      expect(apres.x - avant.x).toBeCloseTo(37, 9);
      expect(apres.y - avant.y).toBeCloseTo(-12, 9);
    }
    // Deux glissements de suite valent leur somme.
    const deux = deplacer(deplacer(OUVERTE, 20, 5, 60), 17, -17, 60);
    expect(aLEcran(FOYER, deux).x).toBeCloseTo(aLEcran(FOYER, vue).x, 9);
    expect(aLEcran(FOYER, deux).y).toBeCloseTo(aLEcran(FOYER, vue).y, 9);
  });

  it(`s'arrête quand le milieu de l'écran est à ${CARTE_DEBORD_CASES} Cases au-delà de la Case la plus éloignée du centre`, () => {
    expect(CARTE_DEBORD_CASES).toBe(2);
    expect(limiteDeLaCarte(carteDe(casesDesAnneaux(0, 60)))).toBe(62);
    // Sur Aube, qui n'a en base que sa Couronne, la Case la plus éloignée est encore sur le bord du Monde.
    expect(limiteDeLaCarte(carteDe(casesDesAnneaux(55, 60)))).toBe(62);
    // Tirer la carte loin vers la gauche, c'est aller loin vers l'est : on s'arrête au coin est du Monde.
    const loin = deplacer(OUVERTE, -100_000, 0, 62);
    expect(loin.milieu.q).toBeCloseTo(62, 9);
    expect(loin.milieu.r).toBeCloseTo(0, 9);
    // Dans toutes les directions, le milieu de l'écran reste à la limite, jamais au-delà.
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 12) {
      const milieu = deplacer(OUVERTE, 100_000 * Math.cos(angle), 100_000 * Math.sin(angle), 62).milieu;
      expect(anneau(milieu)).toBeCloseTo(62, 9);
    }
  });

  it("ramène au plus près un milieu sorti des limites : le long du bord, la carte glisse encore", () => {
    // En deçà, rien ne change.
    expect(borner(sur({ q: 40, r: -10.5 }), 62).milieu).toEqual({ q: 40, r: -10.5 });
    // Au-delà du milieu d'un côté du Monde, droit sur le milieu de ce côté.
    const cote = borner(sur({ q: 124, r: -62 }), 62).milieu;
    expect(cote.q).toBeCloseTo(62, 9);
    expect(cote.r).toBeCloseTo(-31, 9);
    // Arrêté au bord, on glisse encore le long de lui vers l'est : seule la part qui sort est retenue.
    const longe = deplacer(sur({ q: 62, r: -31 }), -1000, 0, 62).milieu;
    expect(anneau(longe)).toBeCloseTo(62, 9);
    expect(longe.q).toBeCloseTo(62, 9);
    expect(longe.r).toBeGreaterThan(-31);
  });
});

describe("la carte au clavier (US-0422)", () => {
  it(`avance de ${CARTE_PAS_CLAVIER_CASES} Cases par flèche : de 3 colonnes vers l'est ou l'ouest, de 3 rangées vers le sud ou le nord`, () => {
    expect(CARTE_PAS_CLAVIER_CASES).toBe(3);
    const proche = (vue: Vue, c: Coordonnees) => {
      expect(vue.milieu.q).toBeCloseTo(c.q, 9);
      expect(vue.milieu.r).toBeCloseTo(c.r, 9);
    };
    proche(avancer(OUVERTE, 1, 0, 62), { q: 34, r: -57 });
    proche(avancer(OUVERTE, -1, 0, 62), { q: 28, r: -57 });
    // Trois rangées plus bas, droit sous le Foyer : une demi-Case à gauche par rangée, en coordonnées.
    proche(avancer(OUVERTE, 0, 1, 62), { q: 29.5, r: -54 });
    proche(avancer(OUVERTE, 0, -1, 62), { q: 32.5, r: -60 });
    // À l'écran, le Foyer s'en va d'autant de l'autre côté, quel que soit le zoom.
    for (const vue of [OUVERTE, { ...OUVERTE, rayon: 40 }]) {
      expect(aLEcran(FOYER, avancer(vue, 1, 0, 62)).x).toBeCloseTo(400 - 3 * Math.sqrt(3) * vue.rayon, 9);
      expect(aLEcran(FOYER, avancer(vue, 0, 1, 62)).y).toBeCloseTo(300 - 3 * 1.5 * vue.rayon, 9);
    }
  });

  it("garde les mêmes limites qu'à la souris", () => {
    let vue = OUVERTE;
    for (let i = 0; i < 40; i++) vue = avancer(vue, 0, -1, 62);
    expect(anneau(vue.milieu)).toBeCloseTo(62, 9);
    expect(vue.milieu.r).toBeCloseTo(-62, 9);
  });
});
