import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ compteConnecte: vi.fn() }));
vi.mock("@/comptes/cookie-session", () => session);
// La vraie garde, branchée sur la session simulée.
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Jeu from "./page";

describe("page du jeu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteConnecte.mockReset();
  });

  it("accueille le joueur connecté", async () => {
    session.compteConnecte.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    const html = renderToStaticMarkup(await Jeu());
    expect(html).toMatch(/<h1[^>]*>Bienvenue dans Bestia<\/h1>/);
    expect(html).toContain("<strong>nom@exemple.fr</strong>");
  });

  it("renvoie vers la connexion sans session", async () => {
    session.compteConnecte.mockResolvedValue(null);
    await expect(Jeu()).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Jeu()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(session.compteConnecte).not.toHaveBeenCalled();
  });
});
