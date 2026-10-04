import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const reinitialisation = vi.hoisted(() => ({ lienValable: vi.fn(), changerMotDePasse: vi.fn() }));
vi.mock("@/comptes/reinitialisation", () => reinitialisation);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import NouveauMotDePasse, { metadata } from "./page";

const ouvrir = async () => renderToStaticMarkup(await NouveauMotDePasse({ params: Promise.resolve({ jeton: "jeton123" }) }));

describe("page du lien « Mot de passe oublié »", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    reinitialisation.lienValable.mockReset();
  });

  it("demande le nouveau mot de passe, avec les règles de l'inscription", async () => {
    reinitialisation.lienValable.mockResolvedValue({ email: "nom@exemple.fr" });
    const html = await ouvrir();
    expect(html).toMatch(/<h1[^>]*>Nouveau mot de passe<\/h1>/);
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain("Au moins 12 caractères.");
    expect(html).toMatch(/<button type="submit"[^>]*>Changer mon mot de passe<\/button>/);
    // Le gestionnaire de mots de passe sait quelle fiche mettre à jour.
    const identifiant = html.match(/<input [^>]*name="username"[^>]*>/)?.[0] ?? "";
    expect(identifiant).toContain('autoComplete="username"');
    expect(identifiant).toContain('value="nom@exemple.fr"');
    expect(identifiant).toContain("hidden");
  });

  it("ne consomme pas le lien à l'ouverture", async () => {
    reinitialisation.lienValable.mockResolvedValue({ email: "nom@exemple.fr" });
    await ouvrir();
    expect(reinitialisation.changerMotDePasse).not.toHaveBeenCalled();
  });

  it("dit qu'un lien périmé ne sert plus, et propose d'en recevoir un nouveau", async () => {
    reinitialisation.lienValable.mockResolvedValue(null);
    const html = await ouvrir();
    expect(html).toContain("Ce lien n&#x27;est plus valable.");
    expect(html).toMatch(/<a [^>]*href="\/mot-de-passe-oublie"[^>]*>Recevoir un nouveau lien<\/a>/);
    expect(html).not.toContain('name="motDePasse"');
  });

  it("ne laisse fuir le jeton vers aucun autre site, et n'est pas indexée", () => {
    expect(metadata).toMatchObject({ referrer: "no-referrer", robots: { index: false, follow: false } });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(ouvrir()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
