import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn() }));
vi.mock("@/comptes/garde", () => garde);
const territoire = vi.hoisted(() => ({ marquerRecitLu: vi.fn() }));
vi.mock("@/monde/territoire", () => territoire);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Arrivee from "./page";

describe("page du récit d'arrivée (US-0158)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  const chef = (territoireId: number | null) => garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse Brune", territoireId });

  it("raconte l'arrivée la première fois : le nom du chef, le récit, et un bouton vers le Foyer, rien d'autre", async () => {
    chef(12);
    territoire.marquerRecitLu.mockResolvedValue({ monde: "Aube" });
    const html = renderToStaticMarkup(await Arrivee());
    expect(html).toMatch(/<h1[^>]*>Ourse Brune\.<\/h1>/);
    expect(html).toContain("Une prairie au bord du Monde, sur la Couronne d&#x27;Aube. C&#x27;est ici que naît votre Foyer.");
    expect(html).toMatch(/<a [^>]*href="\/jeu"[^>]*>Entrer dans mon Foyer<\/a>/);
    expect(territoire.marquerRecitLu).toHaveBeenCalledWith(expect.anything(), 12, expect.any(Date));
    // Le seul paragraphe hors de l'illustration est le récit.
    const contenu = html.slice(html.indexOf("<h1"));
    expect(contenu.match(/<p[ >]/g)).toHaveLength(1);
  });

  it("mène droit au Foyer quand le récit a déjà été lu", async () => {
    chef(12);
    territoire.marquerRecitLu.mockResolvedValue(null);
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("mène droit au Foyer pour un chef né avant les Territoires", async () => {
    chef(null);
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
    expect(territoire.marquerRecitLu).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
