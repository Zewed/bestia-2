import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  ])("la page de %s répond, et reste introuvable en production", (_, Page, titre) => {
    expect(renderToStaticMarkup(<Page />)).toContain(`<h1`);
    expect(renderToStaticMarkup(<Page />)).toContain(titre);
    vi.stubEnv("VERCEL_ENV", "production");
    let erreur: unknown;
    try {
      renderToStaticMarkup(<Page />);
    } catch (e) {
      erreur = e;
    }
    expect(erreur).toMatchObject({ digest: expect.stringContaining("404") });
  });
});
