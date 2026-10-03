import { describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ compteConnecte: vi.fn() }));
vi.mock("./cookie-session", () => session);

import { exigerCompte } from "./garde";

describe("garde du jeu", () => {
  it("rend le compte connecté", async () => {
    session.compteConnecte.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    expect(await exigerCompte("/jeu/territoire")).toEqual({ id: 7, email: "nom@exemple.fr" });
  });

  it("envoie un visiteur vers la connexion, avec la page où revenir ensuite", async () => {
    session.compteConnecte.mockResolvedValue(null);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({
      digest: expect.stringContaining("/connexion?suite=%2Fjeu%2Fterritoire"),
    });
    await expect(exigerCompte()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/connexion;/) });
  });
});
