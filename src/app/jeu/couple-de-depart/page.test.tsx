import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// La vraie garde, branchée sur une session et un chef simulés.
const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("@/comptes/cookie-session", () => cookie);
const session = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("@/comptes/session", () => session);
const chefs = vi.hoisted(() => ({ chefDuCompte: vi.fn() }));
vi.mock("@/chefs/chef", () => chefs);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const donnees = vi.hoisted(() => ({ couplesDeDepartEnBase: vi.fn() }));
vi.mock("@/donnees/en-base", () => donnees);
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import CoupleDeDepart from "./page";

const COUPLES = [
  { espece: { id: "souris", nom: "Souris grise", illustration: "especes/souris.webp" }, rarete: { id: "commune", nom: "Commune" } },
  { espece: { id: "poule", nom: "Poule", illustration: "especes/poule.webp" }, rarete: { id: "commune", nom: "Commune" } },
  { espece: { id: "pigeon", nom: "Pigeon biset", illustration: "especes/pigeon.webp" }, rarete: { id: "commune", nom: "Commune" } },
];

describe("écran du Couple de départ (US-0141)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  const connecte = (chef: { nom: string } | null) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    chefs.chefDuCompte.mockResolvedValue(chef);
    donnees.couplesDeDepartEnBase.mockResolvedValue(COUPLES);
  };

  it("montre les trois cartes dans leur ordre : illustration, nom, Rareté", async () => {
    connecte({ nom: "Ourse" });
    const html = renderToStaticMarkup(await CoupleDeDepart());
    expect(html).toMatch(/<h1[^>]*>Votre Couple de départ<\/h1>/);
    expect([...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1])).toEqual(["Souris grise", "Poule", "Pigeon biset"]);
    expect(html.match(/<img[^>]*alt="([^"]*)"/g)?.map((img) => img.match(/alt="([^"]*)"/)![1])).toEqual(["Souris grise", "Poule", "Pigeon biset"]);
    expect(html.match(/data-rarete="commune"/g)).toHaveLength(3);
  });

  it("n'ajoute aucune phrase : le titre et les cartes suffisent", async () => {
    connecte({ nom: "Ourse" });
    const html = renderToStaticMarkup(await CoupleDeDepart());
    expect(html).not.toMatch(/<p[ >]/);
  });

  it("demande d'abord le nom de chef", async () => {
    connecte(null);
    await expect(CoupleDeDepart()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/nom-de-chef;") });
  });

  it("renvoie vers la connexion sans session, puis ramène ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(CoupleDeDepart()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fcouple-de-depart;") });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(CoupleDeDepart()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
