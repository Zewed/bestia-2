import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const entetes = vi.hoisted(() => ({ authorization: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(entetes.authorization ? { authorization: entetes.authorization } : {}),
}));
const cache = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/cache", () => cache);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const ordre = vi.hoisted(() => [] as string[]);
const stocks = vi.hoisted(() => ({ fixerStock: vi.fn() }));
vi.mock("@/monde/stocks", () => stocks);
const temps = vi.hoisted(() => ({ rattraper: vi.fn(async () => (ordre.push("rattrapage"), new Date())) }));
vi.mock("@/temps/rattraper", () => temps);

import { fixerUnStock } from "./actions";

const MOT_DE_PASSE = "mot-de-passe-d-essai";
const formulaire = (champs: Record<string, string>) => {
  const donnees = new FormData();
  for (const [nom, valeur] of Object.entries(champs)) donnees.set(nom, valeur);
  return donnees;
};
const fixer = (quantite: string) => fixerUnStock({ erreur: null }, formulaire({ territoire: "12", ressource: "bois", quantite }));

describe("fixer un Stock depuis la page de contrôle (US-0208)", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", MOT_DE_PASSE);
    entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
    ordre.length = 0;
    stocks.fixerStock.mockReset().mockImplementation(async () => {
      ordre.push("fixation");
      return { chef: "Ourse Brune", ressource: "Bois", avant: "100.000000", apres: "5000.500000" };
    });
    cache.refresh.mockClear();
    temps.rattraper.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("met le Territoire à l'heure, fixe le Stock, le note dans le journal et rafraîchit la page", async () => {
    const journal = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await fixer("5 000,5")).toEqual({ erreur: null });
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 12);
    expect(stocks.fixerStock).toHaveBeenCalledWith({}, 12, "bois", "5000.5");
    expect(ordre).toEqual(["rattrapage", "fixation"]);
    expect(journal).toHaveBeenCalledWith("Contrôle : Bois de Ourse Brune (Territoire 12) fixé de 100.000000 à 5000.500000.");
    expect(cache.refresh).toHaveBeenCalled();
  });

  it("refuse une quantité qui n'est pas un nombre positif, sans rien toucher", async () => {
    expect(await fixer("-5")).toEqual({ erreur: "Un nombre positif, par exemple 1 234,5." });
    expect(await fixer("beaucoup")).toEqual({ erreur: "Un nombre positif, par exemple 1 234,5." });
    expect(stocks.fixerStock).not.toHaveBeenCalled();
  });

  it("dit quand le Stock n'existe pas", async () => {
    stocks.fixerStock.mockResolvedValueOnce(null);
    expect(await fixer("5")).toEqual({ erreur: "Ce Stock n'existe pas." });
    expect(cache.refresh).not.toHaveBeenCalled();
  });

  it("ne fait rien sans le mot de passe de contrôle", async () => {
    entetes.authorization = null;
    expect(await fixer("5")).toEqual({ erreur: "Accès refusé." });
    expect(stocks.fixerStock).not.toHaveBeenCalled();
  });

  it("ne fait rien en production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await fixer("5")).toEqual({ erreur: "Les stocks ne se modifient pas en production." });
    expect(stocks.fixerStock).not.toHaveBeenCalled();
    expect(temps.rattraper).not.toHaveBeenCalled();
  });
});
