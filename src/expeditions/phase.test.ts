import { describe, expect, it } from "vitest";
import { phaseDUneExpedition } from "./phase";

const MINUTE_MS = 60_000;
const DEPART = new Date("2026-10-09T07:42:00.000Z");
/** Une heure du jeu, `minutes` après le départ. */
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE_MS);

describe("la phase d'une Expédition (US-0911)", () => {
  /** 140 minutes d'aller, puis 4 h de séjour, puis 140 minutes de retour. */
  const EXPEDITION = { partLe: DEPART, trajetMinutes: 140, sejourMinutes: 240 };

  it("est à l'aller dès le départ, et tout le temps du trajet", () => {
    expect(phaseDUneExpedition(EXPEDITION, DEPART)).toBe("aller");
    expect(phaseDUneExpedition(EXPEDITION, apres(139))).toBe("aller");
  });

  it("séjourne dès l'arrivée, toute la durée choisie : le trajet ne la raccourcit pas (US-0906)", () => {
    expect(phaseDUneExpedition(EXPEDITION, apres(140))).toBe("sejour");
    expect(phaseDUneExpedition(EXPEDITION, apres(140 + 239))).toBe("sejour");
  });

  it("rentre à la fin du séjour", () => {
    expect(phaseDUneExpedition(EXPEDITION, apres(140 + 240))).toBe("retour");
    expect(phaseDUneExpedition(EXPEDITION, apres(140 + 240 + 140))).toBe("retour");
  });

  it("reste à l'aller tant que le trajet d'une escorte n'est pas chiffré (US-0912)", () => {
    expect(phaseDUneExpedition({ ...EXPEDITION, trajetMinutes: null }, apres(30 * 24 * 60))).toBe("aller");
  });
});
