import { describe, expect, it } from "vitest";
import { PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";
import { allureMinutesParCase, dureeDuTrajetMinutes, sansEscorte } from "./allure";

describe("l'allure d'une Expédition sans escorte (US-0909)", () => {
  it("part sans escorte quand aucune Bête ne l'accompagne, quelle que soit l'Espèce", () => {
    expect(sansEscorte(new Map())).toBe(true);
    expect(sansEscorte(new Map([["souris", 0]]))).toBe(true);
    expect(sansEscorte(new Map([["souris", 0], ["poule", 0]]))).toBe(true);
    expect(sansEscorte(new Map([["souris", 0], ["poule", 1]]))).toBe(false);
    expect(sansEscorte(new Map([["souris", 3]]))).toBe(false);
  });

  it("avance au pas des explorateurs, celui des réglages : 20 minutes de jeu par Case pour l'instant", () => {
    expect(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE).toBe(20);
    expect(allureMinutesParCase(new Map())).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
    expect(allureMinutesParCase(new Map([["souris", 0], ["poule", 0]]))).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });

  it("ne donne aucune allure à une escorte : celle de sa Bête la plus lente arrive avec la durée du trajet (US-0912)", () => {
    expect(() => allureMinutesParCase(new Map([["souris", 1]]))).toThrow(/US-0912/);
  });
});

describe("la durée du trajet dans le récapitulatif (US-0910)", () => {
  it("sans escorte, compte chaque Case de la distance au pas des explorateurs : le retour dure autant", () => {
    expect(dureeDuTrajetMinutes(7, new Map())).toBe(7 * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
    expect(dureeDuTrajetMinutes(1, new Map([["souris", 0]]))).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });

  it("n'en donne aucune avec une escorte, tant que son allure n'est pas réglée (US-0912)", () => {
    expect(dureeDuTrajetMinutes(7, new Map([["souris", 1]]))).toBeNull();
  });
});
