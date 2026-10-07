import { describe, expect, it } from "vitest";
import { productionAffichee, quantiteAffichee, quantiteExacte, soldeAffiche, soldeEnMots, soldeHoraire } from "./quantite";

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

  it.each([
    ["8.000000", "+8/h"],
    ["14.560000", "+14,5/h"],
    ["0.000000", "+0/h"],
    ["12345.670000", "+12\u00a0345,6/h"],
  ])("la production %s s'affiche « %s » (US-0212)", (parHeure, affichee) => {
    expect(productionAffichee(parHeure)).toBe(affichee);
  });
});

describe("solde horaire (US-0319)", () => {
  it.each([
    ["8.000000", "3.000000", 5],
    ["8.000000", "12.000000", -4],
    ["4.000000", "0.000000", 4],
    // Compté en millionièmes : 4,3 - 1,1 vaut 3,2, pas 3,1999…
    ["4.300000", "1.100000", 3.2],
  ])("une production de %s moins un Entretien de %s donne %s", (parHeure, entretien, solde) => {
    expect(soldeHoraire(parHeure, entretien)).toBe(solde);
  });

  it.each([
    [5, "+5/h"],
    [-3, "−3/h"],
    [0, "0/h"],
    [11.56, "+11,5/h"],
    [-1234, "−1 234/h"],
    // Arrondi vers le bas : un Stock qui baisse ne s'affiche jamais à 0.
    [-0.04, "−0,1/h"],
    [soldeHoraire("4.300000", "1.100000"), "+3,2/h"],
  ])("le solde %s s'affiche « %s », avec un vrai signe moins", (solde, affiche) => {
    expect(soldeAffiche(solde)).toBe(affiche);
  });

  it.each([
    [5, "5 par heure"],
    [-3, "moins 3 par heure"],
    [0, "0 par heure"],
    [-2.25, "moins 2,3 par heure"],
  ])("le solde %s se dit « %s » au lecteur d'écran", (solde, dit) => {
    expect(soldeEnMots(solde)).toBe(dit);
  });
});
