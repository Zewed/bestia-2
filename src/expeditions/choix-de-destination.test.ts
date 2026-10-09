import { describe, expect, it } from "vitest";
import { CASE_D_UN_TERRITOIRE, choixDeDestination, versLaCarte, versLEcran } from "./choix-de-destination";

describe("choisir la destination sur la carte (US-0907)", () => {
  it("ouvre la carte pour choisir la destination, en gardant les autres choix de l'écran, sans sa Case", () => {
    expect(versLaCarte("")).toBe("/jeu/carte?choix=destination");
    expect(versLaCarte("?q=3&r=-5")).toBe("/jeu/carte?choix=destination");
    expect(versLaCarte("sejour=60&q=3&r=-5")).toBe("/jeu/carte?choix=destination&sejour=60");
    expect(versLaCarte("?q=3&explorateurs=2&r=-5&sejour=60")).toBe("/jeu/carte?choix=destination&explorateurs=2&sejour=60");
    // Un autre choix de carte dans l'adresse ne s'y ajoute pas : c'est celui de la destination.
    expect(versLaCarte("choix=autre&sejour=60")).toBe("/jeu/carte?choix=destination&sejour=60");
  });

  it("revient à l'écran d'Expédition avec la Case choisie pour destination, et les autres choix gardés par la carte", () => {
    expect(versLEcran({ q: 3, r: -5 })).toBe("/jeu/expeditions/nouvelle?q=3&r=-5");
    expect(versLEcran({ q: 3, r: -5 }, "choix=destination")).toBe("/jeu/expeditions/nouvelle?q=3&r=-5");
    expect(versLEcran({ q: 3, r: -5 }, "choix=destination&sejour=60")).toBe("/jeu/expeditions/nouvelle?q=3&r=-5&sejour=60");
    // L'ancienne destination ne revient pas : la Case touchée la remplace.
    expect(versLEcran({ q: -1, r: 0 }, "choix=destination&q=3&r=-5&sejour=60")).toBe("/jeu/expeditions/nouvelle?q=-1&r=0&sejour=60");
  });

  it("garde les choix tels quels d'un trajet à l'autre, même ceux qu'il faut coder dans l'adresse", () => {
    const carte = versLaCarte("?nom=Grand%20Lac&q=3&r=-5");
    expect(versLEcran({ q: 4, r: -5 }, carte.split("?")[1])).toBe("/jeu/expeditions/nouvelle?q=4&r=-5&nom=Grand+Lac");
  });

  it("dit si la carte est ouverte pour choisir la destination, à partir des paramètres de son adresse", () => {
    expect(choixDeDestination({})).toBeNull();
    expect(choixDeDestination({ choix: "autre" })).toBeNull();
    expect(choixDeDestination({ choix: "destination" })).toBe("choix=destination");
    expect(choixDeDestination({ choix: "destination", sejour: "60", vide: undefined, explorateurs: ["1", "2"] })).toBe("choix=destination&sejour=60&explorateurs=1&explorateurs=2");
  });

  it("refuse une Case d'un Territoire avec le message décidé le 2026-10-08", () => {
    expect(CASE_D_UN_TERRITOIRE).toBe("Cette Case appartient à un Territoire.");
  });
});
