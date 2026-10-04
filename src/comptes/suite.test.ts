import { describe, expect, it } from "vitest";
import { connexionPuis, suiteSure } from "./suite";

describe("chemin de retour après la connexion", () => {
  it.each(["/jeu", "/jeu/territoire", "/jeu/betes?tri=rarete"])("accepte une page du jeu (%s)", (chemin) => {
    expect(suiteSure(chemin)).toBe(chemin);
  });

  it.each([
    "https://pirate.exemple/jeu",
    "//pirate.exemple/jeu",
    "/\\pirate.exemple/jeu",
    "javascript:alert(1)",
    "/connexion",
    "/jeuxvideo",
    "/jeu/../controle",
    "",
    null,
    undefined,
  ])("ramène à l'accueil du jeu tout le reste (%s)", (chemin) => {
    expect(suiteSure(chemin)).toBe("/jeu");
  });

  it("donne l'adresse de la connexion, avec le retour seulement quand il sert", () => {
    expect(connexionPuis("/jeu/territoire")).toBe("/connexion?suite=%2Fjeu%2Fterritoire");
    expect(connexionPuis("/jeu")).toBe("/connexion");
  });

  it("dit à la connexion qu'une session a expiré (US-0125)", () => {
    expect(connexionPuis("/jeu/territoire", { expiree: true })).toBe("/connexion?suite=%2Fjeu%2Fterritoire&expiree=1");
    expect(connexionPuis("/jeu", { expiree: true })).toBe("/connexion?expiree=1");
  });
});
