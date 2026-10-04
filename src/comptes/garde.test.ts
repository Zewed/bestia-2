import { describe, expect, it, vi } from "vitest";

const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("./cookie-session", () => cookie);
const sessions = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("./session", () => sessions);
const chefs = vi.hoisted(() => ({ chefDuCompte: vi.fn() }));
vi.mock("@/chefs/chef", () => chefs);
vi.mock("@/db", () => ({ getPool: () => ({}) }));

import { exigerCompte, exigerCompteSansChef } from "./garde";

describe("garde du jeu", () => {
  const connecte = (chef: { nom: string } | null) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    sessions.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    chefs.chefDuCompte.mockResolvedValue(chef);
  };

  it("rend le compte connecté qui a son nom de chef", async () => {
    connecte({ nom: "Ourse" });
    expect(await exigerCompte("/jeu/territoire")).toEqual({ id: 7, email: "nom@exemple.fr" });
    expect(chefs.chefDuCompte).toHaveBeenCalledWith(expect.anything(), 7);
  });

  it("envoie un joueur sans nom de chef le choisir, quelle que soit la page demandée (US-0131)", async () => {
    connecte(null);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/nom-de-chef;") });
    await expect(exigerCompte()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/nom-de-chef;") });
  });

  it("ouvre l'écran du nom de chef à un joueur sans nom, et seulement à lui", async () => {
    connecte(null);
    expect(await exigerCompteSansChef()).toEqual({ id: 7, email: "nom@exemple.fr" });
    connecte({ nom: "Ourse" });
    await expect(exigerCompteSansChef()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("envoie un visiteur vers la connexion, avec la page où revenir ensuite", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({
      digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fterritoire;"),
    });
    await expect(exigerCompte()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/connexion;/) });
  });

  it("arrête net une session expirée, et le fait dire à la connexion (US-0125)", async () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-perime");
    sessions.compteDeLaSession.mockResolvedValue(null);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({
      digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fterritoire&expiree=1;"),
    });
  });
});
