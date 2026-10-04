import { describe, expect, it, vi } from "vitest";

const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("./cookie-session", () => cookie);
const sessions = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("./session", () => sessions);
vi.mock("@/db", () => ({ getPool: () => ({}) }));

import { exigerCompte } from "./garde";

describe("garde du jeu", () => {
  it("rend le compte connecté", async () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    sessions.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    expect(await exigerCompte("/jeu/territoire")).toEqual({ id: 7, email: "nom@exemple.fr" });
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
