import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Destination } from "@/expeditions/destination";
import type { Fiche } from "@/monde/fiche";

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
// US-0907 : la destination lue sur base (destination.db.test.ts) : ici, ce que l'écran en montre.
const destinations = vi.hoisted(() => ({ destinationDUneCase: vi.fn(async (): Promise<Destination | null> => null) }));
vi.mock("@/expeditions/destination", () => destinations);
// US-0907 : l'adresse de l'écran, telle que le navigateur l'a, que lit le lien vers la carte.
const adresse = vi.hoisted(() => ({ recherche: "" }));
vi.mock("next/navigation", async (original) => ({ ...(await original<object>()), useSearchParams: () => new URLSearchParams(adresse.recherche) }));
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import NouvelleExpedition, { metadata } from "./page";

/** L'écran d'Expédition ouvert avec `recherche` dans son adresse (« ?q=3&r=-5 » : { q: "3", r: "-5" }). */
const ouvrir = async (recherche: Record<string, string | string[]> = {}) => {
  adresse.recherche = new URLSearchParams(Object.entries(recherche).flatMap(([nom, valeur]) => [valeur].flat().map((v) => [nom, v]))).toString();
  return renderToStaticMarkup(
    await NouvelleExpedition({ params: Promise.resolve({}), searchParams: Promise.resolve(recherche) } as PageProps<"/jeu/expeditions/nouvelle">),
  );
};
/** Les textes de la page, dans l'ordre de la lecture. */
const textes = (html: string) => html.replace(/<[^>]+>/g, "|").split("|").filter(Boolean);
/** L'adresse du lien `nom` de la page. */
const lien = (html: string, nom: string) => html.match(new RegExp(`<a [^>]*href="([^"]*)"[^>]*>${nom}</a>`))?.[1].replace(/&amp;/g, "&");

/** Une forêt libre, à 7 Cases du Foyer. */
const FORET: Fiche = { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 7, anneau: 3 };

describe("l'écran d'Expédition (US-0901)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    destinations.destinationDUneCase.mockReset();
    destinations.destinationDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };

  it("titre la page « Nouvelle Expédition », dans l'onglet comme sur la page", async () => {
    connecte();
    expect(metadata.title).toBe("Nouvelle Expédition");
    expect(await ouvrir()).toMatch(/<main[^>]*><h1[^>]*>Nouvelle Expédition<\/h1>/);
  });

  it("a pour destination la Case de son adresse, touchée sur la carte : son Biome et sa distance au Foyer", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    const html = await ouvrir({ q: "3", r: "-5" });
    // Le Monde vient du Territoire de la garde, jamais de l'adresse, qui ne dit que la Case.
    expect(destinations.destinationDUneCase).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, { q: 3, r: -5 });
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Biome", "Forêt", "Distance", "7 Cases de votre Foyer", "Changer de destination"]);
  });

  it("accorde la distance : « 1 Case de votre Foyer »", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: { ...FORET, distance: 1 } });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toContain("1 Case de votre Foyer");
  });

  it("dit le Biome « inconnu » d'une Case encore sous le brouillard", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: { q: 3, r: -5, inconnue: true, distance: 12 } });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toEqual([
      "Nouvelle Expédition",
      "Destination",
      "Biome",
      "inconnu",
      "Distance",
      "12 Cases de votre Foyer",
      "Changer de destination",
    ]);
  });

  it("ouverte depuis le menu, sans Case, n'a pas de destination, et mène à la carte pour en choisir une", async () => {
    connecte();
    const html = await ouvrir();
    expect(destinations.destinationDUneCase).not.toHaveBeenCalled();
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte"]);
    expect(lien(html, "Choisir sur la carte")).toBe("/jeu/carte?choix=destination");
  });

  it("n'a pas de destination pour une Case que l'adresse dit mal, sans rien demander à la base", async () => {
    connecte();
    const fausses: Record<string, string | string[]>[] = [{ q: "3" }, { r: "-5" }, { q: "trois", r: "-5" }, { q: "3.5", r: "-5" }, { q: "3", r: "1e3" }, { q: "9999999999", r: "0" }, { q: ["3", "4"], r: "-5" }];
    for (const recherche of fausses) {
      expect(textes(await ouvrir(recherche))).toContain("Aucune destination");
    }
    expect(destinations.destinationDUneCase).not.toHaveBeenCalled();
  });

  it("n'a pas de destination pour une Case que le Monde du joueur n'a pas", async () => {
    connecte();
    expect(textes(await ouvrir({ q: "999", r: "0" }))).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte"]);
  });

  it("n'ajoute aucune phrase d'explication : le titre, puis la destination et de quoi la changer", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toHaveLength(7);
  });

  it("montre d'abord le récit d'arrivée s'il ne l'a pas été (US-0160)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: 12, recitLu: false });
    await expect(ouvrir()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
  });

  it("renvoie vers la connexion sans session, qui ramènera ensuite ici, avec la même destination", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(ouvrir()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fexpeditions%2Fnouvelle;") });
    await expect(ouvrir({ q: "3", r: "-5" })).rejects.toMatchObject({
      digest: expect.stringContaining(`;/connexion?suite=${encodeURIComponent("/jeu/expeditions/nouvelle?q=3&r=-5")};`),
    });
    expect(destinations.destinationDUneCase).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(ouvrir({ q: "3", r: "-5" })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });
});

describe("choisir la destination depuis l'écran d'Expédition (US-0907)", () => {
  afterEach(() => {
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    destinations.destinationDUneCase.mockReset();
    destinations.destinationDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };

  it("mène à la carte ouverte pour choisir la destination, même quand l'écran en a déjà une, pour la changer", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    expect(lien(await ouvrir({ q: "3", r: "-5" }), "Changer de destination")).toBe("/jeu/carte?choix=destination");
  });

  it("garde en chemin les autres choix de l'écran, que la carte lui rendra avec la Case touchée", async () => {
    connecte();
    expect(lien(await ouvrir({ sejour: "60" }), "Choisir sur la carte")).toBe("/jeu/carte?choix=destination&sejour=60");
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    expect(lien(await ouvrir({ q: "3", r: "-5", explorateurs: "2" }), "Changer de destination")).toBe("/jeu/carte?choix=destination&explorateurs=2");
  });

  it("refuse une Case qui appartient à un Territoire, le Foyer du joueur compris, avec le message décidé, et mène à la carte", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ refus: "Cette Case appartient à un Territoire." });
    const html = await ouvrir({ q: "0", r: "0" });
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Cette Case appartient à un Territoire.", "Choisir sur la carte"]);
    expect(html).not.toMatch(/Biome|Distance|Aucune destination/);
    expect(lien(html, "Choisir sur la carte")).toBe("/jeu/carte?choix=destination");
  });
});
