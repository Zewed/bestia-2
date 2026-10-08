// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vueSurLeFoyer, type Vue } from "./dessin";
import { retenirLaVue, vueRetenue } from "./vue-retenue";

/** Ce que l'onglet retient de la carte. */
const CLE = "bestia.vue-de-la-carte";
const CARTE = { monde: "Carte-0417", foyer: { q: 31, r: -57 } };
/** La carte loin du Foyer, rapprochée, sur un écran d'ordinateur. */
const LAISSEE: Vue = { ...vueSurLeFoyer(CARTE.foyer, 800, 600), milieu: { q: 40.25, r: -51.5 }, rayon: 30 };

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("la vue de la carte retenue le temps d'une visite (US-0427)", () => {
  it("se retrouve telle qu'on l'a laissée : le même endroit au milieu, le même zoom, à la taille de l'écran d'aujourd'hui", () => {
    retenirLaVue(CARTE, LAISSEE);
    expect(vueRetenue(CARTE, 800, 600)).toEqual(LAISSEE);
    // En Cases et en taille de Case, pas en pixels : un écran tourné retrouve le même endroit.
    expect(vueRetenue(CARTE, 375, 559)).toEqual({ ...LAISSEE, largeur: 375, hauteur: 559 });
    expect(JSON.parse(sessionStorage.getItem(CLE)!)).toEqual({ ...CARTE, milieu: LAISSEE.milieu, rayon: 30 });
  });

  it("n'est retenue que pour l'onglet : rien dans la mémoire de l'appareil", () => {
    retenirLaVue(CARTE, LAISSEE);
    expect(localStorage.length).toBe(0);
    sessionStorage.clear();
    expect(vueRetenue(CARTE, 800, 600)).toBeNull();
  });

  it("n'est jamais reprise sur un autre Monde, ni sur un autre Foyer", () => {
    retenirLaVue(CARTE, LAISSEE);
    expect(vueRetenue({ ...CARTE, monde: "Aube" }, 800, 600)).toBeNull();
    expect(vueRetenue({ ...CARTE, foyer: { q: 31, r: -56 } }, 800, 600)).toBeNull();
  });

  it("n'est pas reprise si ce que l'onglet a retenu ne se lit pas", () => {
    for (const illisible of ["{", "null", "[]", JSON.stringify({ ...CARTE, milieu: { q: 1 }, rayon: 30 }), JSON.stringify({ ...CARTE, milieu: { q: 1, r: 2 }, rayon: 0 })]) {
      sessionStorage.setItem(CLE, illisible);
      expect(vueRetenue(CARTE, 800, 600), illisible).toBeNull();
    }
  });

  it("ne casse rien quand l'onglet ne peut rien retenir : la carte se rouvre sur le Foyer", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("stockage interdit");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("stockage interdit");
    });
    expect(() => retenirLaVue(CARTE, LAISSEE)).not.toThrow();
    expect(vueRetenue(CARTE, 800, 600)).toBeNull();
  });
});
