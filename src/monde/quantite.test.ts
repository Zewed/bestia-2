import { describe, expect, it } from "vitest";
import { quantiteAffichee } from "./quantite";

describe("quantité affichée (US-0203)", () => {
  it.each([
    ["100.000000", "100"],
    ["1999.800000", "1\u00a0999"],
    ["0.999999", "0"],
    ["12500", "12\u00a0500"],
    [1234567.5, "1\u00a0234\u00a0567"],
  ])("%s s'affiche « %s » : entier, arrondi vers le bas, milliers séparés", (quantite, affichee) => {
    expect(quantiteAffichee(quantite)).toBe(affichee);
  });
});
