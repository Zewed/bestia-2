import { describe, expect, it } from "vitest";
import { finDeLaPhase, phaseDUneExpedition, retourDUneExpedition, sejourDUneExpedition } from "./phase";

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

describe("la fin de la phase et le retour d'une Expédition (US-0918)", () => {
  /** 140 minutes d'aller, puis 4 h de séjour, puis 140 minutes de retour. */
  const EXPEDITION = { partLe: DEPART, trajetMinutes: 140, sejourMinutes: 240 };

  it("finit l'aller à l'arrivée, le séjour au bout de la durée choisie, et le retour au Foyer", () => {
    expect(finDeLaPhase(EXPEDITION, DEPART)).toEqual(apres(140));
    expect(finDeLaPhase(EXPEDITION, apres(139))).toEqual(apres(140));
    expect(finDeLaPhase(EXPEDITION, apres(140))).toEqual(apres(140 + 240));
    expect(finDeLaPhase(EXPEDITION, apres(140 + 240))).toEqual(apres(140 + 240 + 140));
  });

  it("revient au Foyer après l'aller, le séjour, puis un retour aussi long que l'aller (US-0912)", () => {
    expect(retourDUneExpedition(EXPEDITION)).toEqual(apres(140 + 240 + 140));
  });

  it("ne chiffre ni la fin de l'aller ni le retour tant que le trajet d'une escorte ne l'est pas (US-0912)", () => {
    expect(finDeLaPhase({ ...EXPEDITION, trajetMinutes: null }, DEPART)).toBeNull();
    expect(retourDUneExpedition({ ...EXPEDITION, trajetMinutes: null })).toBeNull();
  });
});

describe("le séjour d'une Expédition sur sa Case (US-0915)", () => {
  /** 140 minutes d'aller, puis 4 h de séjour, puis 140 minutes de retour. */
  const EXPEDITION = { partLe: DEPART, trajetMinutes: 140, sejourMinutes: 240 };

  it("commence à l'arrivée et dure toute la durée choisie ; sa fin en est exclue", () => {
    expect(sejourDUneExpedition(EXPEDITION)).toEqual({ debut: apres(140), fin: apres(140 + 240) });
  });

  it("est exactement le temps de la phase « séjour », à la milliseconde près, du départ au retour", () => {
    const { debut, fin } = sejourDUneExpedition(EXPEDITION)!;
    const instants = [debut, fin].flatMap((t) => [-1, 0, 1].map((ms) => new Date(t.getTime() + ms)));
    for (let minutes = 0; minutes <= 140 + 240 + 140; minutes += 7) instants.push(apres(minutes));
    for (const instant of instants) expect(phaseDUneExpedition(EXPEDITION, instant) === "sejour").toBe(instant >= debut && instant < fin);
  });

  it("n'a pas lieu tant que le trajet d'une escorte n'est pas chiffré (US-0912)", () => {
    expect(sejourDUneExpedition({ ...EXPEDITION, trajetMinutes: null })).toBeNull();
  });
});
