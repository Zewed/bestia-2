import { describe, expect, it } from "vitest";
import { quantiteAffichee, quantiteExacte } from "./quantite";

describe("quantité affichée (US-0203)", () => {
  it.each([
    ["100.000000", "100"],
    ["1999.800000", "1\u00a0999"],
    ["0.999999", "0"],
    ["12500", "12\u00a0500"],
    ["99999.990000", "99\u00a0999"],
  ])("%s s'affiche « %s » : entier, arrondi vers le bas, milliers séparés", (quantite, affichee) => {
    expect(quantiteAffichee(quantite)).toBe(affichee);
  });

  it.each([
    ["100000", "100\u00a0k"],
    ["123456.700000", "123\u00a0k"],
    ["199999.999999", "199\u00a0k"],
    ["999999", "999\u00a0k"],
    ["1000000", "1\u00a0M"],
    ["1299999", "1,2\u00a0M"],
    ["9999999", "9,9\u00a0M"],
    ["12345678", "12\u00a0M"],
    ["123456789", "123\u00a0M"],
    ["1234567890", "1\u00a0234\u00a0M"],
  ])("%s s'abrège en « %s », sans jamais arrondir vers le haut (US-0206)", (quantite, affichee) => {
    expect(quantiteAffichee(quantite)).toBe(affichee);
  });

  it.each([
    ["1234.400000", "1\u00a0234,4"],
    ["100.000000", "100"],
    ["0.000001", "0,000001"],
    ["123456789.120000", "123\u00a0456\u00a0789,12"],
  ])("%s se lit exactement « %s » sur la page de contrôle (US-0208)", (quantite, lue) => {
    expect(quantiteExacte(quantite)).toBe(lue);
  });
});
