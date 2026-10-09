import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";

// La vraie garde, branchée sur une session simulée.
const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("@/comptes/cookie-session", () => cookie);
const session = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("@/comptes/session", () => session);
const chefs = vi.hoisted(() => ({
  chefDuCompte: vi.fn<() => Promise<{ nom: string; territoireId: number | null; recitLu: boolean }>>(async () => ({ nom: "Ourse", territoireId: 12, recitLu: true })),
  naitreSurLaCouronne: vi.fn(async (): Promise<number | null> => null),
}));
vi.mock("@/chefs/chef", () => chefs);
// Les Expéditions en cours, lues sur base (src/expeditions/depart.db.test.ts) : ici, ce que la liste en montre.
const enCours = vi.hoisted(() => ({ expeditionsEnCours: vi.fn(async (): Promise<ExpeditionEnCours[]> => []) }));
vi.mock("@/expeditions/en-cours", () => enCours);
const INSTANT = new Date("2026-10-09T07:42:13.250Z");
vi.mock("@/temps/horloge", () => ({ maintenant: () => INSTANT, vitesse: () => 1 }));
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import ExpeditionsEnCours, { metadata } from "./page";

/** Une Expédition partie vers une forêt à 3 Cases, et une autre vers une Case encore sous le brouillard, à 1 Case. */
const EXPEDITIONS: ExpeditionEnCours[] = [
  { id: 5, destination: { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 3, anneau: 3 }, phase: "aller" },
  { id: 6, destination: { q: 4, r: -5, inconnue: true, distance: 1 }, phase: "sejour" },
];

describe("la liste des Expéditions en cours (US-0911)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    enCours.expeditionsEnCours.mockReset();
  });

  const connecte = (expeditions = EXPEDITIONS) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    enCours.expeditionsEnCours.mockResolvedValue(expeditions);
  };
  /** Le texte de chaque ligne de la liste, ses morceaux séparés par « · ». */
  const lignes = (html: string) =>
    [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));

  it("titre la page « Expéditions en cours », dans l'onglet comme sur la page", async () => {
    connecte();
    expect(metadata.title).toBe("Expéditions en cours");
    expect(renderToStaticMarkup(await ExpeditionsEnCours())).toMatch(/<main[^>]*><h1[^>]*>Expéditions en cours<\/h1>/);
  });

  it("montre chaque Expédition en cours du Territoire, à l'heure du jeu : sa destination, sa distance et sa phase", async () => {
    connecte();
    const html = renderToStaticMarkup(await ExpeditionsEnCours());
    expect(enCours.expeditionsEnCours).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, INSTANT);
    expect(lignes(html)).toEqual(["Forêt · 3 Cases de votre Foyer · Aller", "Case inconnue · 1 Case de votre Foyer · Séjour"]);
  });

  it("dit la phase de retour", async () => {
    connecte([{ ...EXPEDITIONS[0], phase: "retour" }]);
    expect(lignes(renderToStaticMarkup(await ExpeditionsEnCours()))).toEqual(["Forêt · 3 Cases de votre Foyer · Retour"]);
  });

  it("sans Expédition en cours, le dit, sans liste", async () => {
    connecte([]);
    const html = renderToStaticMarkup(await ExpeditionsEnCours());
    expect(html).toContain("Aucune Expédition en cours");
    expect(html).not.toContain("<ul");
  });

  it("renvoie vers la connexion sans session, qui ramènera ensuite ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(ExpeditionsEnCours()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fexpeditions;") });
    expect(enCours.expeditionsEnCours).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(ExpeditionsEnCours()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });
});
