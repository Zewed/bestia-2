import { describe, expect, it } from "vitest";
import { formaterDuree, formaterMinutes } from "./affichage";

describe("durée avant qu'un stock soit plein (US-0226)", () => {
  it.each([
    [0.0001, "1 min"],
    [0.75, "45 min"],
    [3 + 20 / 60, "3 h 20"],
    [3 + 5 / 60, "3 h 05"],
    [7, "7 h"],
    [23.99, "1 j"],
    [24, "1 j"],
    [2 * 24 + 5 + 0.2, "2 j 5 h"],
  ])("%f heures s'affichent « %s »", (heures, affichee) => {
    expect(formaterDuree(heures)).toBe(affichee);
  });
});

describe("une durée en minutes entières (US-0906)", () => {
  it("s'affiche comme les autres durées, sans repasser par les heures : 500 min font « 8 h 20 », pas « 8 h 21 »", () => {
    expect([30, 60, 125, 250, 500, 510, 1440].map(formaterMinutes)).toEqual(["30 min", "1 h", "2 h 05", "4 h 10", "8 h 20", "8 h 30", "1 j"]);
  });
});
