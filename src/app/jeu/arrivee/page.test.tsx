import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const garde = vi.hoisted(() => ({ exigerCompte: vi.fn(), PAGE_ARRIVEE: "/jeu/arrivee" }));
vi.mock("@/comptes/garde", () => garde);
const territoire = vi.hoisted(() => ({ foyerDuTerritoire: vi.fn(), marquerRecitLu: vi.fn() }));
vi.mock("@/monde/territoire", () => territoire);
vi.mock("./actions", () => ({ entrerDansLeFoyer: vi.fn() }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Arrivee from "./page";

describe("page du récit d'arrivée (US-0158)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  const chef = (territoireId: number | null, recitLu: boolean) =>
    garde.exigerCompte.mockResolvedValue({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse Brune", territoireId, recitLu });

  it("raconte l'arrivée : le nom du chef, le récit, et un bouton vers le Foyer, rien d'autre", async () => {
    chef(12, false);
    territoire.foyerDuTerritoire.mockResolvedValue({ biome: { id: "prairie", nom: "Prairie" }, monde: "Aube" });
    const html = renderToStaticMarkup(await Arrivee());
    expect(html).toMatch(/<h1[^>]*>Ourse Brune\.<\/h1>/);
    expect(html).toContain("Une prairie au bord du Monde, sur la Couronne d&#x27;Aube. C&#x27;est ici que naît votre Foyer.");
    expect(html).toMatch(/<form[^>]*>.*<button type="submit"[^>]*>Entrer dans mon Foyer<\/button><\/form>/);
    // La garde laisse passer la page du récit elle-même (US-0160).
    expect(garde.exigerCompte).toHaveBeenCalledWith("/jeu/arrivee");
    // Le seul paragraphe hors de l'illustration est le récit.
    const contenu = html.slice(html.indexOf("<h1"));
    expect(contenu.match(/<p[ >]/g)).toHaveLength(1);
  });

  it("ne note pas le récit comme lu en s'affichant : seul le bouton le fait (US-0160)", async () => {
    chef(12, false);
    territoire.foyerDuTerritoire.mockResolvedValue({ biome: { id: "prairie", nom: "Prairie" }, monde: "Aube" });
    renderToStaticMarkup(await Arrivee());
    renderToStaticMarkup(await Arrivee());
    expect(territoire.marquerRecitLu).not.toHaveBeenCalled();
  });

  it("mène droit au Foyer quand le joueur y est déjà entré", async () => {
    chef(12, true);
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("mène droit au Foyer pour un chef toujours sans Foyer", async () => {
    chef(null, false);
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Arrivee()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
