import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
// La session du visiteur : personne n'est connecté, sauf quand un test le décide.
const session = vi.hoisted(() => ({ compteConnecte: vi.fn(async () => null as { id: number; email: string } | null) }));
vi.mock("@/comptes/cookie-session", () => session);

import Connexion from "./connexion/page";
import Inscription from "./inscription/page";
import Accueil from "./page";

describe("entrée du jeu sur la page d'accueil", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("montre « Créer un compte » vers l'inscription et « Se connecter » vers la connexion", () => {
    const html = renderToStaticMarkup(<Accueil />);
    expect(html).toMatch(/<a [^>]*href="\/inscription"[^>]*>Créer un compte<\/a>/);
    expect(html).toMatch(/<a [^>]*href="\/connexion"[^>]*>Se connecter<\/a>/);
    expect(html).toContain("Faites votre sac : l&#x27;aventure vous attend.");
    expect(html).not.toContain("Ouverture prochaine");
  });

  it("laisse « Ouverture prochaine » à leur place en production, tant que l'inscription ne marche pas", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const html = renderToStaticMarkup(<Accueil />);
    expect(html).toContain("Ouverture prochaine");
    expect(html).not.toContain('href="/inscription"');
    expect(html).not.toContain('href="/connexion"');
  });

  it.each([
    ["inscription", Inscription, "Créer un compte"],
    ["connexion", Connexion, "Se connecter"],
  ])("la page de %s répond, et reste introuvable en production", async (_, Page, titre) => {
    // La page de connexion lit ses paramètres (US-0121) : elle est asynchrone.
    const rendre = async () =>
      renderToStaticMarkup(await (Page as (p: { searchParams: Promise<object> }) => ReactNode)({ searchParams: Promise.resolve({}) }));
    const html = await rendre();
    expect(html).toContain("<h1");
    expect(html).toContain(titre);
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(rendre()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("garde dans la connexion la page du jeu où revenir, après l'avoir vérifiée", async () => {
    const rendre = async (suite: string) => renderToStaticMarkup(await Connexion({ searchParams: Promise.resolve({ suite }) }));
    expect(await rendre("/jeu/territoire")).toContain('<input type="hidden" name="suite" value="/jeu/territoire"/>');
    expect(await rendre("https://pirate.exemple")).toContain('<input type="hidden" name="suite" value="/jeu"/>');
  });

  it.each([
    ["l'inscription", () => Inscription(), "/jeu"],
    ["la connexion", () => Connexion({ searchParams: Promise.resolve({ suite: "/jeu/territoire" }) }), "/jeu/territoire"],
  ])("envoie droit au jeu un joueur déjà connecté qui ouvre %s", async (_, ouvrir, vers) => {
    session.compteConnecte.mockResolvedValueOnce({ id: 7, email: "nom@exemple.fr" });
    await expect(ouvrir()).rejects.toMatchObject({ digest: expect.stringContaining(`;${vers};`) });
  });
});
