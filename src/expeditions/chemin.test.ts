import { describe, expect, it } from "vitest";
import { casesDesAnneaux, type Coordonnees, distance, voisines } from "@/monde/hex";
import { PORTEE_D_EXPLORATION_CASES } from "@/reglages";
import { cheminDUneExpedition } from "./chemin";

const FOYER: Coordonnees = { q: 12, r: -7 };
/** Une Case à (dq, dr) du Foyer. */
const aLEcart = (dq: number, dr: number): Coordonnees => ({ q: FOYER.q + dq, r: FOYER.r + dr });
/** Toutes les destinations possibles autour du Foyer, jusqu'à la portée d'exploration. */
const DESTINATIONS = casesDesAnneaux(1, PORTEE_D_EXPLORATION_CASES).map(({ q, r }) => aLEcart(q, r));

describe("le chemin d'une Expédition (US-0912)", () => {
  it("passe de Case en Case, du Foyer à la destination : chacune voisine de la précédente", () => {
    for (const destination of DESTINATIONS) {
      const pas = [FOYER, ...cheminDUneExpedition(FOYER, destination)];
      expect(pas.at(-1)).toEqual(destination);
      for (let i = 1; i < pas.length; i++) expect(voisines(pas[i - 1])).toContainEqual(pas[i]);
    }
  });

  it("va en ligne droite, l'eau comprise : autant de Cases que la distance de la carte, chacune un pas plus loin du Foyer", () => {
    for (const destination of DESTINATIONS) {
      const chemin = cheminDUneExpedition(FOYER, destination);
      expect(chemin).toHaveLength(distance(FOYER, destination));
      expect(chemin.map((laCase) => distance(FOYER, laCase))).toEqual(chemin.map((_, i) => i + 1));
    }
  });

  it("suit tout droit l'une des six directions quand la destination s'y trouve", () => {
    expect(cheminDUneExpedition(FOYER, aLEcart(3, 0))).toEqual([aLEcart(1, 0), aLEcart(2, 0), aLEcart(3, 0)]);
    expect(cheminDUneExpedition(FOYER, aLEcart(-2, 2))).toEqual([aLEcart(-1, 1), aLEcart(-2, 2)]);
    expect(cheminDUneExpedition(FOYER, aLEcart(0, -1))).toEqual([aLEcart(0, -1)]);
  });

  it("ne donne jamais « -0 » pour une coordonnée", () => {
    for (const laCase of cheminDUneExpedition({ q: 0, r: 0 }, { q: -3, r: 1 })) {
      expect(Object.is(laCase.q, -0) || Object.is(laCase.r, -0)).toBe(false);
    }
  });
});
