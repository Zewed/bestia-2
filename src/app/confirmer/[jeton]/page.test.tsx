import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResultatConfirmation } from "@/comptes/confirmation";

const confirmation = vi.hoisted(() => ({ confirmerAdresse: vi.fn(), nouveauLienDepuis: vi.fn() }));
vi.mock("@/comptes/confirmation", () => confirmation);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import ConfirmerAdresse, { metadata } from "./page";

const ouvrir = async (resultat: ResultatConfirmation) => {
  confirmation.confirmerAdresse.mockResolvedValue(resultat);
  return renderToStaticMarkup(await ConfirmerAdresse({ params: Promise.resolve({ jeton: "jeton123" }) }));
};

describe("page du lien de confirmation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    confirmation.confirmerAdresse.mockReset();
  });

  it("confirme l'adresse à l'ouverture et affiche « Adresse confirmée »", async () => {
    const html = await ouvrir("confirmee");
    expect(confirmation.confirmerAdresse).toHaveBeenCalledWith({}, "jeton123");
    expect(html).toMatch(/<h1[^>]*>Adresse confirmée<\/h1>/);
    expect(html).toMatch(/<a [^>]*href="\/connexion"[^>]*>Se connecter<\/a>/);
  });

  it("dit qu'une adresse est déjà confirmée quand le lien a déjà servi", async () => {
    expect(await ouvrir("deja-confirmee")).toMatch(/<h1[^>]*>Adresse déjà confirmée<\/h1>/);
  });

  it("propose un nouveau lien quand celui-ci a expiré", async () => {
    const html = await ouvrir("expire");
    expect(html).toMatch(/<h1[^>]*>Ce lien a expiré<\/h1>/);
    expect(html).toContain("valable 24 heures");
    expect(html).toMatch(/<button type="submit"[^>]*>Recevoir un nouveau lien<\/button>/);
  });

  it("explique quoi faire d'un lien inconnu", async () => {
    const html = await ouvrir("inconnu");
    expect(html).toMatch(/<h1[^>]*>Ce lien n&#x27;est pas valable<\/h1>/);
    expect(html).not.toContain("Recevoir un nouveau lien");
  });

  it("ne laisse fuir le jeton vers aucun autre site, et n'est pas indexée", () => {
    expect(metadata).toMatchObject({ referrer: "no-referrer", robots: { index: false, follow: false } });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(ouvrir("confirmee")).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(confirmation.confirmerAdresse).not.toHaveBeenCalled();
  });
});
