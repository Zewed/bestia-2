import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({
  joueurConnecte: vi.fn(),
  stocksALHeure: vi.fn(async () => [
    { id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", parHeure: "8.000000" },
    { id: "vegetaux", nom: "Végétaux", famille: "nourriture", quantite: "1999.800000", parHeure: "14.000000" },
    { id: "bois", nom: "Bois", famille: "materiaux", quantite: "12500.400000", parHeure: "4.000000" },
    { id: "pierre", nom: "Pierre", famille: "materiaux", quantite: "0.999999", parHeure: "4.000000" },
  ]),
}));
vi.mock("@/comptes/garde", () => garde);
vi.mock("@/comptes/deconnexion", () => ({ seDeconnecter: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import { ActionsDuJeu } from "./ActionsDuJeu";

describe("actions du joueur dans la barre, sur les pages du jeu", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    garde.joueurConnecte.mockReset();
    garde.stocksALHeure.mockClear();
  });
  const joueur = (chef: { nomDeChef: string | null; territoireId?: number | null; recitLu?: boolean }) =>
    garde.joueurConnecte.mockResolvedValue({ compte: { id: 7, email: "nom@exemple.fr" }, territoireId: null, recitLu: false, ...chef });

  const rendu = async () => {
    const element = await ActionsDuJeu();
    return element ? renderToStaticMarkup(element) : "";
  };

  it("montre le nom de chef, qui ouvre le menu (US-0140)", async () => {
    joueur({ nomDeChef: "Ourse" });
    const html = await rendu();
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*>.*Ourse/);
    expect(html).not.toContain("nom@exemple.fr");
  });

  it("garde « Se déconnecter » seul tant que le joueur n'a pas de nom", async () => {
    joueur({ nomDeChef: null });
    expect(await rendu()).toMatch(/<button[^>]*>Se déconnecter<\/button>/);
  });

  it("montre ses quatre ressources, dans l'ordre, avant son nom, une fois entré dans son Foyer (US-0203)", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    const html = await rendu();
    expect(garde.stocksALHeure).toHaveBeenCalledWith(12);
    const ressources = [...html.matchAll(/<img[^>]*alt="([^"]+)"[^>]*\/> <span[^>]*>([^<]+)<\/span>/g)].map((m) => [m[1], m[2]]);
    expect(ressources).toEqual([
      ["Viande", "100"],
      ["Végétaux", "1\u00a0999"],
      ["Bois", "12\u00a0500"],
      ["Pierre", "0"],
    ]);
    expect(html).toMatch(/<div[^>]*aria-label="Ressources"/);
    expect(html.indexOf("Ressources")).toBeLessThan(html.indexOf("Ourse"));
  });

  it("ne les montre pas avant le récit d'arrivée, ni sans Territoire", async () => {
    joueur({ nomDeChef: "Ourse", territoireId: 12, recitLu: false });
    expect(await rendu()).not.toContain("Ressources");
    joueur({ nomDeChef: "Ourse", territoireId: null, recitLu: false });
    expect(await rendu()).not.toContain("Ressources");
    expect(garde.stocksALHeure).not.toHaveBeenCalled();
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
