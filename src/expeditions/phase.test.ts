import { describe, expect, it } from "vitest";
import { demiTourDUneExpedition, finDeLaPhase, phaseDUneExpedition, retourDUneExpedition, sejourDUneExpedition } from "./phase";

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

describe("une Expédition rappelée (US-0920)", () => {
  /** 140 minutes d'aller, puis 4 h de séjour, puis 140 minutes de retour, sauf rappel. */
  const EXPEDITION = { partLe: DEPART, trajetMinutes: 140, sejourMinutes: 240 };
  /** Rappelée 50 minutes après son départ, à l'aller. */
  const A_L_ALLER = { ...EXPEDITION, rappeleeLe: apres(50) };
  /** Rappelée 1 h 30 après son arrivée, en séjour. */
  const EN_SEJOUR = { ...EXPEDITION, rappeleeLe: apres(140 + 90) };

  it("à l'aller, fait demi-tour aussitôt : le retour dure le temps déjà parcouru", () => {
    expect(phaseDUneExpedition(A_L_ALLER, apres(49))).toBe("aller");
    expect(phaseDUneExpedition(A_L_ALLER, apres(50))).toBe("retour");
    expect(retourDUneExpedition(A_L_ALLER)).toEqual(apres(50 + 50));
    expect(phaseDUneExpedition(A_L_ALLER, apres(140))).toBe("retour");
    expect(finDeLaPhase(A_L_ALLER, apres(49))).toEqual(apres(50));
    expect(finDeLaPhase(A_L_ALLER, apres(50))).toEqual(apres(100));
  });

  it("à l'aller, ne séjourne pas : elle n'est jamais sur sa Case", () => {
    expect(sejourDUneExpedition(A_L_ALLER)).toBeNull();
    for (let minutes = 0; minutes <= 140 + 240 + 140; minutes += 7) expect(phaseDUneExpedition(A_L_ALLER, apres(minutes))).not.toBe("sejour");
  });

  it("rappelée au départ même, est aussitôt de retour", () => {
    const aussitot = { ...EXPEDITION, rappeleeLe: DEPART };
    expect(phaseDUneExpedition(aussitot, DEPART)).toBe("retour");
    expect(retourDUneExpedition(aussitot)).toEqual(DEPART);
  });

  it("en séjour, y met fin et repart aussitôt, pour un retour aussi long que l'aller (décidé le 2026-10-08)", () => {
    expect(sejourDUneExpedition(EN_SEJOUR)).toEqual({ debut: apres(140), fin: apres(140 + 90) });
    expect(phaseDUneExpedition(EN_SEJOUR, apres(140 + 89))).toBe("sejour");
    expect(phaseDUneExpedition(EN_SEJOUR, apres(140 + 90))).toBe("retour");
    expect(finDeLaPhase(EN_SEJOUR, apres(140))).toEqual(apres(140 + 90));
    expect(retourDUneExpedition(EN_SEJOUR)).toEqual(apres(140 + 90 + 140));
  });

  it("rappelée à l'arrivée pile, ne séjourne pas un instant", () => {
    const aLArrivee = { ...EXPEDITION, rappeleeLe: apres(140) };
    expect(sejourDUneExpedition(aLArrivee)).toEqual({ debut: apres(140), fin: apres(140) });
    expect(phaseDUneExpedition(aLArrivee, apres(140))).toBe("retour");
    expect(retourDUneExpedition(aLArrivee)).toEqual(apres(280));
  });

  it("garde ses horaires jusqu'au rappel ; un rappel après la fin du séjour ne change rien", () => {
    for (let minutes = 0; minutes < 50; minutes += 7) expect(phaseDUneExpedition(A_L_ALLER, apres(minutes))).toBe(phaseDUneExpedition(EXPEDITION, apres(minutes)));
    for (const rappeleeLe of [null, undefined, apres(140 + 240), apres(140 + 240 + 60)]) {
      expect(retourDUneExpedition({ ...EXPEDITION, rappeleeLe })).toEqual(retourDUneExpedition(EXPEDITION));
      expect(sejourDUneExpedition({ ...EXPEDITION, rappeleeLe })).toEqual(sejourDUneExpedition(EXPEDITION));
    }
  });

  it("fait demi-tour au rappel, ou à la fin du séjour sans rappel, avec l'aller fait jusque-là", () => {
    expect(demiTourDUneExpedition(A_L_ALLER)).toEqual({ le: apres(50), allerMs: 50 * MINUTE_MS });
    expect(demiTourDUneExpedition(EN_SEJOUR)).toEqual({ le: apres(140 + 90), allerMs: 140 * MINUTE_MS });
    expect(demiTourDUneExpedition(EXPEDITION)).toEqual({ le: apres(140 + 240), allerMs: 140 * MINUTE_MS });
    expect(demiTourDUneExpedition({ ...A_L_ALLER, trajetMinutes: null })).toBeNull();
  });
});
