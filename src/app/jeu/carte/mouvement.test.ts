import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARTE_RETOUR_AU_FOYER_MS } from "@/reglages";
import { vueSurLeFoyer, type Vue } from "./dessin";
import { glisser } from "./mouvement";
import { enChemin, retourAuFoyer } from "./vue";

/** Ce que le mouvement a demandé de faire à la prochaine image de l'écran. */
let aLaProchaineImage = new Map<number, FrameRequestCallback>();
/** Si le joueur préfère les écrans sans mouvement. */
let sansMouvement = false;

beforeEach(() => {
  aLaProchaineImage = new Map();
  let demandes = 0;
  vi.stubGlobal("requestAnimationFrame", (rappel: FrameRequestCallback) => {
    aLaProchaineImage.set(++demandes, rappel);
    return demandes;
  });
  vi.stubGlobal("cancelAnimationFrame", (demande: number) => aLaProchaineImage.delete(demande));
  vi.stubGlobal("matchMedia", (requete: string) => ({ matches: requete === "(prefers-reduced-motion: reduce)" && sansMouvement }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  sansMouvement = false;
});

/** Lance ce que le mouvement a demandé pour l'image de l'écran affichée à l'instant `ms`. */
const image = (ms: number) => {
  const rappels = [...aLaProchaineImage.values()];
  aLaProchaineImage.clear();
  for (const rappel of rappels) rappel(ms);
};

const FOYER = { q: 31, r: -57 };
const ARRIVEE = vueSurLeFoyer(FOYER, 800, 600);
const DEPART: Vue = { ...ARRIVEE, milieu: { q: 60, r: -20 }, rayon: 40 };

describe("le retour au Foyer, en mouvement (US-0426)", () => {
  it(`glisse de la vue de départ à celle du Foyer en ${CARTE_RETOUR_AU_FOYER_MS} ms, une vue par image de l'écran`, () => {
    expect(CARTE_RETOUR_AU_FOYER_MS).toBe(300);
    expect(retourAuFoyer(DEPART, FOYER)).toEqual(ARRIVEE);
    const montrees: Vue[] = [];
    glisser(DEPART, ARRIVEE, (vue) => montrees.push(vue));
    // Rien avant la première image ; puis une vue par image, jusqu'à l'arrivée, et plus rien ensuite.
    expect(montrees).toEqual([]);
    image(1000);
    image(1016);
    image(1150);
    expect(montrees).toEqual([enChemin(DEPART, ARRIVEE, 0), enChemin(DEPART, ARRIVEE, 16 / 300), enChemin(DEPART, ARRIVEE, 0.5)]);
    image(1310);
    expect(montrees.at(-1)).toEqual(ARRIVEE);
    expect(aLaProchaineImage.size).toBe(0);
  });

  it("s'arrête là où il en est quand on l'arrête", () => {
    const montrees: Vue[] = [];
    const arreter = glisser(DEPART, ARRIVEE, (vue) => montrees.push(vue));
    image(0);
    image(100);
    arreter();
    expect(aLaProchaineImage.size).toBe(0);
    expect(montrees).toHaveLength(2);
  });

  it("va droit au Foyer, sans mouvement, quand le joueur préfère les écrans sans mouvement", () => {
    sansMouvement = true;
    const montrees: Vue[] = [];
    glisser(DEPART, ARRIVEE, (vue) => montrees.push(vue));
    expect(montrees).toEqual([ARRIVEE]);
    expect(aLaProchaineImage.size).toBe(0);
  });
});
