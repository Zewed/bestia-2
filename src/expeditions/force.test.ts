import { describe, expect, it } from "vitest";
import { appliquerBareme } from "@/donnees/bareme";
import { forceDeLEscorte, forceDUneBete } from "./force";

/** Les caractéristiques de la souris et de la poule, tirées de leurs mesures par le barème (ADR 0007). */
const SOURIS = appliquerBareme({ masseG: 20, arme: 1, nourritureGParJour: 4 });
const POULE = appliquerBareme({ masseG: 2000, arme: 0.4, nourritureGParJour: 120 });

describe("la force d'une Bête (US-0905)", () => {
  it("vaut la racine carrée de l'attaque multipliée par la vie de son Espèce (décidé le 2026-10-08)", () => {
    // La souris : 473 d'attaque et 473 de vie. La poule : 5 981 d'attaque (coups de bec) et 14 953 de vie.
    expect(forceDUneBete(SOURIS)).toBe(473);
    expect(forceDUneBete(POULE)).toBe(9457);
    expect(forceDUneBete({ attaque: 16, vie: 25 })).toBe(20);
  });

  it("est arrondie à l'entier le plus proche", () => {
    expect(forceDUneBete({ attaque: 2, vie: 3 })).toBe(2); // √6 ≈ 2,45
    expect(forceDUneBete({ attaque: 3, vie: 4 })).toBe(3); // √12 ≈ 3,46
    expect(forceDUneBete({ attaque: 4, vie: 5 })).toBe(4); // √20 ≈ 4,47
    expect(forceDUneBete({ attaque: 5, vie: 6 })).toBe(5); // √30 ≈ 5,48
    expect(forceDUneBete({ attaque: 6, vie: 7 })).toBe(6); // √42 ≈ 6,48
    expect(forceDUneBete({ attaque: 7, vie: 9 })).toBe(8); // √63 ≈ 7,94
  });

  it("est nulle pour une Espèce sans arme, quelle que soit sa vie", () => {
    expect(forceDUneBete(appliquerBareme({ masseG: 500, arme: 0, nourritureGParJour: 20 }))).toBe(0);
  });
});

describe("la force de l'escorte (US-0905)", () => {
  it("vaut zéro sans escorte : sans Espèce, ou sans aucune Bête choisie", () => {
    expect(forceDeLEscorte([])).toBe(0);
    expect(
      forceDeLEscorte([
        { force: 473, nombre: 0 },
        { force: 9457, nombre: 0 },
      ]),
    ).toBe(0);
  });

  it("est la simple somme des forces de ses Bêtes", () => {
    expect(forceDeLEscorte([{ force: 473, nombre: 1 }])).toBe(473);
    expect(forceDeLEscorte([{ force: 473, nombre: 2 }])).toBe(946);
    expect(
      forceDeLEscorte([
        { force: 473, nombre: 2 },
        { force: 9457, nombre: 1 },
      ]),
    ).toBe(946 + 9457);
  });

  it("n'a ni bonus de groupe ni règle de taille : mille souris valent mille fois une souris, et plus que la poule (ADR 0003)", () => {
    expect(forceDeLEscorte([{ force: 473, nombre: 1000 }])).toBe(473_000);
    expect(forceDeLEscorte([{ force: 473, nombre: 20 }])).toBeGreaterThan(forceDeLEscorte([{ force: 9457, nombre: 1 }]));
  });
});
