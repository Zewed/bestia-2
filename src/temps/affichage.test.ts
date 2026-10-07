import { describe, expect, it } from "vitest";
import { formaterDuree } from "./affichage";

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
