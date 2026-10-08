import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CarteDuJoueur } from "@/monde/carte";

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
const lecture = vi.hoisted(() => ({ carteDuJoueur: vi.fn(async (): Promise<CarteDuJoueur | null> => null) }));
vi.mock("@/monde/carte", () => lecture);
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Carte, { metadata } from "./page";

/** La carte d'un joueur d'Aube, réduite à trois Cases de la Couronne, son Foyer au milieu. */
const CARTE: CarteDuJoueur = { monde: "Aube", foyer: { q: 31, r: -57 }, cases: { q: [30, 31, 32], r: [-57, -57, -57] } };

describe("page Carte (US-0417)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    lecture.carteDuJoueur.mockReset();
  });

  const connecte = (carte: CarteDuJoueur | null = CARTE) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    lecture.carteDuJoueur.mockResolvedValue(carte);
  };

  it("titre l'onglet « Carte », et le dit aux lecteurs d'écran sans phrase de plus : la carte suffit", async () => {
    connecte();
    expect(metadata.title).toBe("Carte");
    const html = renderToStaticMarkup(await Carte());
    expect(html).toMatch(/^<main[^>]*><h1[^>]*>Carte<\/h1><canvas[^>]*><\/canvas><\/main>$/);
  });

  it("dessine la carte du Monde du joueur, lue pour son Territoire, en une image nommée", async () => {
    connecte();
    const html = renderToStaticMarkup(await Carte());
    expect(lecture.carteDuJoueur).toHaveBeenCalledWith(expect.anything(), 12);
    expect(html).toMatch(/<canvas[^>]*role="img"[^>]*aria-label="Carte du Monde Aube, votre Foyer au milieu"/);
  });

  it("n'a pas de carte à montrer sans Foyer", async () => {
    connecte(null);
    expect(renderToStaticMarkup(await Carte())).not.toContain("<canvas");
  });

  it("prend toute la place sous la barre du haut, sans défiler", () => {
    const css = readFileSync(join(process.cwd(), "src/app/jeu/carte/page.module.css"), "utf8");
    expect(css).toMatch(/\.page \{[^}]*height: var\(--hauteur-utile\);[^}]*overflow: hidden;/);
    expect(css).toMatch(/\.carte \{[^}]*display: block;[^}]*width: 100%;[^}]*height: 100%;/);
  });

  it("montre d'abord le récit d'arrivée s'il ne l'a pas été (US-0160)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: 12, recitLu: false });
    await expect(Carte()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
  });

  it("renvoie vers la connexion sans session, qui ramènera ensuite ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(Carte()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fcarte;") });
    expect(lecture.carteDuJoueur).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Carte()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });
});
