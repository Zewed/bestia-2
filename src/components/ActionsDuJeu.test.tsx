import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ joueurConnecte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/comptes/deconnexion", () => ({ seDeconnecter: vi.fn() }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import { ActionsDuJeu } from "./ActionsDuJeu";

describe("actions du joueur dans la barre, sur les pages du jeu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.joueurConnecte.mockReset();
  });

  const rendu = async () => {
    const element = await ActionsDuJeu();
    return element ? renderToStaticMarkup(element) : "";
  };

  it("montre le nom de chef, qui ouvre le menu (US-0140)", async () => {
    garde.joueurConnecte.mockResolvedValue({ compte: { id: 7, email: "nom@exemple.fr" }, nomDeChef: "Ourse" });
    const html = await rendu();
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*>.*Ourse/);
    expect(html).not.toContain("nom@exemple.fr");
  });

  it("garde « Se déconnecter » seul tant que le joueur n'a pas de nom", async () => {
    garde.joueurConnecte.mockResolvedValue({ compte: { id: 7, email: "nom@exemple.fr" }, nomDeChef: null });
    expect(await rendu()).toMatch(/<button[^>]*>Se déconnecter<\/button>/);
  });

  it("ne montre rien sans session", async () => {
    garde.joueurConnecte.mockResolvedValue(null);
    expect(await rendu()).toBe("");
  });

  it("ne montre rien en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await rendu()).toBe("");
    expect(garde.joueurConnecte).not.toHaveBeenCalled();
  });
});
