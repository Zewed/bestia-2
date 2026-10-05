import { describe, expect, it } from "vitest";
import { anneau, casesDesAnneaux, voisines } from "./hex";

describe("géométrie des Cases", () => {
  it("mesure l'anneau d'une Case : sa distance au Cœur sauvage", () => {
    expect(anneau({ q: 0, r: 0 })).toBe(0);
    expect(anneau({ q: 3, r: -1 })).toBe(3);
    expect(anneau({ q: -2, r: -2 })).toBe(4);
  });

  it("compte six Cases par anneau et par pas d'anneau", () => {
    for (const k of [1, 2, 7, 60]) expect(casesDesAnneaux(k, k)).toHaveLength(6 * k);
    expect(casesDesAnneaux(0, 0)).toEqual([{ q: 0, r: 0 }]);
  });

  it("donne à chaque Case six voisines, à un pas d'elle", () => {
    const autour = voisines({ q: 2, r: -1 });
    expect(autour).toHaveLength(6);
    for (const v of autour) expect(anneau({ q: v.q - 2, r: v.r + 1 })).toBe(1);
  });
});
