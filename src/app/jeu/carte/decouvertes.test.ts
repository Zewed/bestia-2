import { describe, expect, it } from "vitest";
import type { CarteDuJoueur } from "@/monde/carte";
import { BROUILLARD } from "@/monde/couleurs-de-la-carte";
import { casesDesAnneaux } from "@/monde/hex";
import { ZONE_COURONNE } from "@/monde/zones";
import { avecLesDecouvertes, nombreDeDecouvertes } from "./decouvertes";

const FOYER = { q: 31, r: -57 };
const AUTOUR = casesDesAnneaux(0, 1).map((c) => ({ q: c.q + FOYER.q, r: c.r + FOYER.r }));
/** Le Foyer découvert, en prairie de la Couronne, ses six voisines sous le brouillard. */
const CARTE: CarteDuJoueur = {
  monde: "Aube",
  foyer: FOYER,
  foyers: [],
  teintes: ["prairie", BROUILLARD],
  cases: { q: AUTOUR.map((c) => c.q), r: AUTOUR.map((c) => c.r), teinte: AUTOUR.map((_, i) => (i === 0 ? 0 : 1)), zone: AUTOUR.map((_, i) => (i === 0 ? ZONE_COURONNE : 0)) },
};

describe("les Cases découvertes depuis la lecture de la carte (US-0442)", () => {
  it("se comptent : toutes celles qui ne sont pas sous le brouillard", () => {
    expect(nombreDeDecouvertes(CARTE)).toBe(1);
    expect(nombreDeDecouvertes({ ...CARTE, teintes: ["prairie"], cases: { ...CARTE.cases, teinte: AUTOUR.map(() => 0) } })).toBe(7);
  });

  it("prennent leur teinte et leur zone sur la carte, une nouvelle teinte après les autres, sans rien changer à sa forme ni aux autres Cases", () => {
    const decouvertes = {
      cases: { q: [AUTOUR[0].q, AUTOUR[2].q, AUTOUR[5].q], r: [AUTOUR[0].r, AUTOUR[2].r, AUTOUR[5].r], teinte: ["prairie", "lac", "prairie"], zone: [ZONE_COURONNE, ZONE_COURONNE, ZONE_COURONNE] },
      foyers: [AUTOUR[5]],
    };
    const apres = avecLesDecouvertes(CARTE, decouvertes);
    expect(apres.teintes).toEqual(["prairie", BROUILLARD, "lac"]);
    expect(apres.cases.teinte).toEqual([0, 1, 2, 1, 1, 0, 1]);
    expect(apres.cases.zone).toEqual([ZONE_COURONNE, 0, ZONE_COURONNE, 0, 0, ZONE_COURONNE, 0]);
    expect(apres.foyers).toEqual([AUTOUR[5]]);
    expect(nombreDeDecouvertes(apres)).toBe(3);
    // La même forme, le même Monde et le même Foyer ; la carte d'avant, intacte.
    expect(apres.cases.q).toBe(CARTE.cases.q);
    expect(apres.cases.r).toBe(CARTE.cases.r);
    expect([apres.monde, apres.foyer]).toEqual([CARTE.monde, CARTE.foyer]);
    expect(CARTE.cases.teinte).toEqual([0, 1, 1, 1, 1, 1, 1]);
    expect(CARTE.teintes).toEqual(["prairie", BROUILLARD]);
  });

  it("passent une Case que la carte n'a pas", () => {
    const apres = avecLesDecouvertes(CARTE, { cases: { q: [1000], r: [0], teinte: ["mer"], zone: [0] }, foyers: [] });
    expect(apres.cases.teinte).toEqual(CARTE.cases.teinte);
  });
});
