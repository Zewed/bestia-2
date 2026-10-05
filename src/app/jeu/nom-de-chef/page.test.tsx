import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// La vraie garde, branchée sur une session et un chef simulés.
const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("@/comptes/cookie-session", () => cookie);
const session = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("@/comptes/session", () => session);
const chefs = vi.hoisted(() => ({ chefDuCompte: vi.fn() }));
vi.mock("@/chefs/chef", () => chefs);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import NomDeChef from "./page";

describe("écran du nom de chef", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };

  it("demande le nom, sans rien d'autre", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValue(null);
    const html = renderToStaticMarkup(await NomDeChef());
    expect(html).toMatch(/<h1[^>]*>Votre nom de chef<\/h1>/);
    expect(html).toMatch(/<input [^>]*name="nom"/);
    expect(html).toMatch(/<button [^>]*disabled=""[^>]*>Valider<\/button>/);
    // Pas d'étiquette visible : le titre suffit. Une seule ligne de texte, la règle qu'on ne devinerait pas (US-0139).
    const formulaire = html.slice(html.indexOf("<form"), html.indexOf("</form>"));
    expect(formulaire).not.toMatch(/<label[ >]/);
    expect(formulaire.match(/<p[ >][^<]*/g)).toEqual([expect.stringContaining("Ce nom ne pourra plus être changé")]);
  });

  it("envoie au jeu un joueur qui a déjà son nom", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValue({ nom: "Ourse" });
    await expect(NomDeChef()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("renvoie vers la connexion sans session, puis ramène ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(NomDeChef()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fnom-de-chef;") });
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(NomDeChef()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
