import { describe, expect, it } from "vitest";
import { COMPTES_OUVERTS_EN_PRODUCTION, entreeDuJeuOuverte } from "./ouverture";

describe("ouverture de l'entrée du jeu", () => {
  it("est ouverte en local et sur les prévisualisations", () => {
    expect(entreeDuJeuOuverte({})).toBe(true);
    expect(entreeDuJeuOuverte({ VERCEL_ENV: "preview" })).toBe(true);
    expect(entreeDuJeuOuverte({ VERCEL_ENV: "development" })).toBe(true);
  });

  it("reste fermée en production tant qu'un nouveau joueur ne peut pas vraiment commencer", () => {
    expect(COMPTES_OUVERTS_EN_PRODUCTION).toBe(false);
    expect(entreeDuJeuOuverte({ VERCEL_ENV: "production" })).toBe(false);
  });
});
