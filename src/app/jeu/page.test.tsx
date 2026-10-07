import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

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
const territoire = vi.hoisted(() => ({ foyerDuTerritoire: vi.fn(async () => ({ biome: { id: "prairie", nom: "Prairie" } })) }));
vi.mock("@/monde/territoire", () => territoire);
const absence = vi.hoisted(() => ({ recapitulatifDAbsence: vi.fn(async (): Promise<{ id: string; nom: string; gain: string }[]> => []) }));
vi.mock("@/monde/absence", () => absence);
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Foyer from "./page";

describe("écran du Foyer (US-0157)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };

  it("montre la hutte du chef en grand, et le Biome du Foyer posé dessus", async () => {
    connecte();
    const html = renderToStaticMarkup(await Foyer());
    expect(html).toMatch(/<img[^>]*alt="La hutte du chef, au toit de chaume et à la tête de loup, dans la prairie au petit matin"/);
    expect(html).toContain("foyer%2Fprairie.webp");
    expect(html).toMatch(/<h1[^>]*>Foyer · prairie<\/h1>/);
    expect(territoire.foyerDuTerritoire).toHaveBeenCalledWith(expect.anything(), 12);
  });

  it("n'ajoute rien d'autre : ni accueil ni phrase, le nom du chef est dans la barre du haut", async () => {
    connecte();
    const html = renderToStaticMarkup(await Foyer());
    expect(html).not.toContain("Bienvenue");
    expect(html).not.toMatch(/<p[ >]/);
  });

  it("ne mène à aucune fonction qui n'existe pas encore : ni lien, ni bouton, ni menu (US-0163)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Foyer());
    expect(html).not.toMatch(/<(a|button|form|nav|input|select)[ >]/);
    expect(html.match(/<(img|h1)[ >]/g)).toEqual(["<img ", "<h1 "]);
  });

  it("pose sur l'illustration ce que le Foyer a produit pendant l'absence (US-0216)", async () => {
    connecte();
    absence.recapitulatifDAbsence.mockResolvedValueOnce([
      { id: "viande", nom: "Viande", gain: "40.250000" },
      { id: "vegetaux", nom: "Végétaux", gain: "25.000000" },
    ]);
    const html = renderToStaticMarkup(await Foyer());
    expect(absence.recapitulatifDAbsence).toHaveBeenCalledWith(expect.anything(), 12, expect.any(Date));
    expect(html).toMatch(/<button[^>]*>Pendant votre absence : \+40 Viande, \+25 Végétaux<\/button>/);
  });

  it("montre « Foyer » seul pour un chef toujours sans Foyer (Monde complet)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: null, recitLu: false });
    expect(renderToStaticMarkup(await Foyer())).toMatch(/<h1[^>]*>Foyer<\/h1>/);
  });

  it("montre d'abord le récit d'arrivée s'il ne l'a pas été (US-0160)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: 12, recitLu: false });
    await expect(Foyer()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
  });

  it("renvoie vers la connexion sans session", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(Foyer()).rejects.toMatchObject({ digest: expect.stringContaining("/connexion") });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Foyer()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });
});
