import { describe, expect, it } from "vitest";
import { lireQuantite, modificationsPermises } from "./stocks";

describe("ajuster un Stock depuis la page de contrôle (US-0208)", () => {
  it.each([
    ["5000", "5000"],
    ["1 234,5", "1234.5"],
    ["1 234.25", "1234.25"],
    ["0", "0"],
    [" 0,4 ", "0.4"],
  ])("lit « %s » comme %s", (saisie, lu) => {
    expect(lireQuantite(saisie)).toBe(lu);
  });

  it.each(["", "-5", "abc", "1,2,3", "1e5", "1234567890123456789"])("refuse « %s »", (saisie) => {
    expect(lireQuantite(saisie)).toBeNull();
  });

  it("se modifie en local et sur les prévisualisations, jamais en production", () => {
    expect(modificationsPermises({})).toBe(true);
    expect(modificationsPermises({ VERCEL_ENV: "preview" })).toBe(true);
    expect(modificationsPermises({ VERCEL_ENV: "production" })).toBe(false);
  });
});
