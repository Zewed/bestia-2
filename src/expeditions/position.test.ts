import { describe, expect, it } from "vitest";
import type { Coordonnees } from "@/monde/hex";
import { cheminDUneExpedition } from "./chemin";
import type { HorairesDUneExpedition } from "./phase";
import { positionDUneExpedition } from "./position";

const MINUTE_MS = 60_000;
const DEPART = new Date("2026-10-09T07:42:00.000Z");
/** Une heure du jeu, `minutes` après le départ. */
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE_MS);

const FOYER: Coordonnees = { q: 12, r: -7 };
/** Une destination à 3 Cases à l'est du Foyer : son chemin passe par (13, -7) et (14, -7). */
const DESTINATION: Coordonnees = { q: 15, r: -7 };
const [PREMIERE, DEUXIEME] = cheminDUneExpedition(FOYER, DESTINATION);
/** 3 Cases au pas des explorateurs, 20 minutes chacune : 60 minutes d'aller, puis 4 h de séjour, puis 60 minutes de retour. */
const EXPEDITION: HorairesDUneExpedition = { partLe: DEPART, trajetMinutes: 60, sejourMinutes: 240 };
/** Où en est l'Expédition `minutes` après son départ. */
const a = (minutes: number, horaires = EXPEDITION) => positionDUneExpedition(FOYER, DESTINATION, horaires, apres(minutes));

describe("la position d'une Expédition sur son chemin (US-0913)", () => {
  it("part du Foyer, puis atteint chaque Case de son chemin l'une après l'autre, une par pas de son allure", () => {
    expect(a(0)).toEqual({ avancee: 0, rang: 0, case: FOYER });
    expect(a(19)).toMatchObject({ rang: 0, case: FOYER });
    expect(a(20)).toEqual({ avancee: 1, rang: 1, case: PREMIERE });
    expect(a(39)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(40)).toEqual({ avancee: 2, rang: 2, case: DEUXIEME });
  });

  it("dit aussi où elle en est entre deux Cases, en fraction de Case faite depuis le Foyer", () => {
    expect(a(5).avancee).toBeCloseTo(0.25, 12);
    expect(a(50).avancee).toBeCloseTo(2.5, 12);
  });

  it("atteint sa destination à l'arrivée pile, et y reste pendant tout le séjour", () => {
    expect(a(59)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(60)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
    expect(a(60 + 239)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
  });

  it("rentre par le même chemin, Case par Case, à la même allure, et retrouve le Foyer à son retour", () => {
    const retour = 60 + 240;
    expect(a(retour)).toEqual({ avancee: 3, rang: 3, case: DESTINATION });
    // Elle est encore sur la destination tant qu'elle n'a pas atteint la Case d'avant.
    expect(a(retour + 10)).toMatchObject({ rang: 3, case: DESTINATION });
    expect(a(retour + 10).avancee).toBeCloseTo(2.5, 12);
    expect(a(retour + 20)).toEqual({ avancee: 2, rang: 2, case: DEUXIEME });
    expect(a(retour + 41)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(retour + 60)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("reste au Foyer une fois rentrée", () => {
    expect(a(60 + 240 + 60 + 24 * 60)).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("avance au pas de son escorte : une allure plus lente espace d'autant les Cases (US-0912)", () => {
    // 3 Cases à 50 minutes chacune.
    const lente = { ...EXPEDITION, trajetMinutes: 150 };
    expect(a(49, lente)).toMatchObject({ rang: 0, case: FOYER });
    expect(a(50, lente)).toMatchObject({ rang: 1, case: PREMIERE });
    expect(a(149, lente)).toMatchObject({ rang: 2, case: DEUXIEME });
    expect(a(150, lente)).toMatchObject({ rang: 3, case: DESTINATION });
  });

  it("reste au Foyer tant que le trajet d'une escorte n'est pas chiffré (US-0912)", () => {
    expect(a(30 * 24 * 60, { ...EXPEDITION, trajetMinutes: null })).toEqual({ avancee: 0, rang: 0, case: FOYER });
  });

  it("donne la même Case que celle de la carte, jamais une copie : la carte reconnaît ainsi qu'elle n'a pas bougé", () => {
    const chemin = cheminDUneExpedition(FOYER, DESTINATION);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(0), chemin).case).toBe(FOYER);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(25), chemin).case).toBe(chemin[0]);
    expect(positionDUneExpedition(FOYER, DESTINATION, EXPEDITION, apres(60), chemin).case).toBe(chemin[2]);
  });
});
