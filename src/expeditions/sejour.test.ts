import { describe, expect, it } from "vitest";
import { SEJOUR_MINUTES, SEJOURS_TOUT_PRETS_MINUTES } from "@/reglages";
import { horaireDuSejour, SEJOUR_PAR_DEFAUT_MINUTES, sejourChoisi } from "./sejour";

const MINUTE = 60_000;
/** Un instant du jeu quelconque, pas à l'heure pile. */
const DEPART = new Date("2026-10-09T07:42:13.250Z");
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE);

describe("la durée du séjour (US-0906)", () => {
  it("se choisit entre deux bornes, par pas réguliers, et chaque durée toute prête tombe sur l'un de ces pas", () => {
    const { min, max, pas } = SEJOUR_MINUTES;
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThan(min);
    expect((max - min) % pas).toBe(0);
    for (const minutes of SEJOURS_TOUT_PRETS_MINUTES) {
      expect(minutes).toBeGreaterThanOrEqual(min);
      expect(minutes).toBeLessThanOrEqual(max);
      expect((minutes - min) % pas).toBe(0);
    }
  });

  it("vaut d'abord la première durée toute prête", () => {
    expect(SEJOUR_PAR_DEFAUT_MINUTES).toBe(SEJOURS_TOUT_PRETS_MINUTES[0]);
  });

  it("se lit dans l'adresse en minutes, seulement si on aurait pu la choisir", () => {
    expect(["30", "60", "150", "1440"].map(sejourChoisi)).toEqual([30, 60, 150, 1440]);
    const fausses = [undefined, null, "", "0", "-60", "1470", "45", "60.5", "6e1", " 60", "0x3c", "une heure", "060"];
    expect(fausses.map(sejourChoisi)).toEqual(fausses.map(() => null));
  });

  it("ne commence qu'à l'arrivée : quel que soit le trajet, l'Expédition reste sur la Case toute la durée choisie", () => {
    for (const trajet of [0, 1, 45, 10 * 60 + 17]) {
      for (const sejour of [SEJOUR_MINUTES.min, 4 * 60, SEJOUR_MINUTES.max]) {
        const { debut, fin } = horaireDuSejour(DEPART, trajet * MINUTE, sejour);
        expect(debut).toEqual(apres(trajet));
        expect(fin).toEqual(apres(trajet + sejour));
      }
    }
  });
});
