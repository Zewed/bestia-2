import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Destination } from "@/expeditions/destination";
import type { Fiche } from "@/monde/fiche";
import { SEJOUR_MINUTES } from "@/reglages";
import { formaterMinutes } from "@/temps/affichage";

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
// US-0902 : les explorateurs du Territoire, et leur bloc et le départ réduits à ce que la page leur donne (testés à part).
// US-0903 : de même pour l'heure du prochain retour, et le message qui remplace le formulaire sans explorateur libre.
const explorateurs = vi.hoisted(() => ({
  explorateursDuTerritoire: vi.fn(async () => ({ libres: 2, total: 3 })),
  prochainRetourDUnExplorateur: vi.fn(async (): Promise<Date | null> => null),
}));
vi.mock("@/monde/explorateurs", () => explorateurs);
vi.mock("./Explorateurs", () => ({ Explorateurs: (p: object) => <i data-explorateurs={JSON.stringify(p)} /> }));
vi.mock("./Partir", () => ({ Partir: (p: object) => <i data-partir={JSON.stringify(p)} /> }));
vi.mock("./AucunExplorateurLibre", () => ({ AucunExplorateurLibre: (p: object) => <i data-aucun={JSON.stringify(p)} /> }));
// US-0904 : les Bêtes disponibles du Territoire, et le bloc Escorte réduit à ce que la page lui donne (testé à part).
const effectif = vi.hoisted(() => ({
  betesDisponibles: vi.fn(async () => [{ id: "souris", nom: "Souris grise", illustration: "especes/souris.webp", disponibles: 3 }]),
}));
vi.mock("@/monde/effectif", () => effectif);
vi.mock("./Escorte", () => ({ Escorte: (p: object) => <i data-escorte={JSON.stringify(p)} /> }));
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

/** US-0906 : les textes du bloc Séjour, après la destination : la durée choisie, les bornes du curseur, les durées toutes prêtes. */
const SEJOUR = ["Séjour", "1 h", formaterMinutes(SEJOUR_MINUTES.min), formaterMinutes(SEJOUR_MINUTES.max), "1 h", "4 h", "8 h", "12 h"];

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
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Biome", "Forêt", "Distance", "7 Cases de votre Foyer", "Changer de destination", ...SEJOUR]);
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
      ...SEJOUR,
    ]);
  });

  it("ouverte depuis le menu, sans Case, n'a pas de destination, et mène à la carte pour en choisir une", async () => {
    connecte();
    const html = await ouvrir();
    expect(destinations.destinationDUneCase).not.toHaveBeenCalled();
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte", ...SEJOUR]);
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
    expect(textes(await ouvrir({ q: "999", r: "0" }))).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte", ...SEJOUR]);
  });

  it("n'ajoute aucune phrase d'explication : le titre, la destination et de quoi la changer, puis le séjour", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toHaveLength(7 + SEJOUR.length);
  });

  it("propose la durée du séjour, avec ou sans destination, entre les explorateurs et le départ (US-0906)", async () => {
    connecte();
    // Le bloc Séjour, seul entre les blocs Explorateurs et Escorte (US-0904) et le départ (réduits ici à ce que la page leur donne).
    const entreExplorateursEtDepart = /<i data-explorateurs="[^"]*"><\/i><i data-escorte="[^"]*"><\/i><section[^>]*><h2[^>]*>Séjour<\/h2>((?!<section).)*<\/section><i data-partir="[^"]*"><\/i><\/main>$/;
    const sansDestination = await ouvrir();
    expect(sansDestination).toMatch(/<input [^>]*type="range"[^>]*name="sejour"/);
    expect(sansDestination).toMatch(entreExplorateursEtDepart);
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    const avecDestination = await ouvrir({ q: "3", r: "-5", sejour: "240" });
    expect(avecDestination).toMatch(entreExplorateursEtDepart);
    // La durée que l'adresse garde, rapportée de la carte avec la Case touchée.
    expect(textes(avecDestination).slice(-SEJOUR.length)).toEqual(["Séjour", "4 h", ...SEJOUR.slice(2)]);
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

describe("les explorateurs de l'écran d'Expédition (US-0902)", () => {
  afterEach(() => {
    explorateurs.explorateursDuTerritoire.mockClear();
    destinations.destinationDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };
  /** Ce que la page donne au bloc Explorateurs, puis au départ, tel qu'elle le rend. */
  const donne = (nom: string, valeur: object) => `<i data-${nom}="${JSON.stringify(valeur).replaceAll('"', "&quot;")}"></i>`;

  it("propose les explorateurs du Territoire de la garde, libres sur total, juste après la destination", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    const html = await ouvrir({ q: "3", r: "-5" });
    expect(explorateurs.explorateursDuTerritoire).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12);
    // US-0907 : le bloc Destination finit sur le lien qui la change.
    expect(html).toMatch(new RegExp(`7 Cases de votre Foyer</dd></div></dl><a [^>]*>Changer de destination</a></section>${donne("explorateurs", { libres: 2, total: 3 })}`));
  });

  it("finit sur le départ, qui sait combien d'explorateurs sont libres, avec ou sans destination", async () => {
    connecte();
    expect(await ouvrir()).toMatch(new RegExp(`${donne("partir", { libres: 2 })}</main>$`));
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    expect(await ouvrir({ q: "3", r: "-5" })).toMatch(new RegExp(`${donne("partir", { libres: 2 })}</main>$`));
  });

  it("ne propose aucun explorateur à un chef sans Territoire, sans rien demander à la base : le message à la place (US-0903)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: null, recitLu: true });
    const html = await ouvrir();
    expect(explorateurs.explorateursDuTerritoire).not.toHaveBeenCalled();
    expect(explorateurs.prochainRetourDUnExplorateur).not.toHaveBeenCalled();
    expect(html).toContain(donne("aucun", { total: 0, prochainRetour: null }));
    expect(html).not.toContain("data-explorateurs");
  });
});

describe("aucun explorateur libre sur l'écran d'Expédition (US-0903)", () => {
  afterEach(() => {
    explorateurs.explorateursDuTerritoire.mockClear();
    explorateurs.prochainRetourDUnExplorateur.mockClear();
    destinations.destinationDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };
  /** Ce que la page donne au message, tel qu'elle le rend. */
  const donne = (valeur: object) => `<i data-aucun="${JSON.stringify(valeur).replaceAll('"', "&quot;")}"></i>`;

  it("sans aucun explorateur, met le message à la place du formulaire : ni destination, ni explorateurs, ni départ", async () => {
    connecte();
    explorateurs.explorateursDuTerritoire.mockResolvedValueOnce({ libres: 0, total: 0 });
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    const html = await ouvrir({ q: "3", r: "-5" });
    expect(html).toMatch(new RegExp(`<main[^>]*><h1[^>]*>Nouvelle Expédition</h1>${donne({ total: 0, prochainRetour: null })}</main>$`));
    // Personne n'est parti : aucun retour à attendre, rien à demander à la base.
    expect(explorateurs.prochainRetourDUnExplorateur).not.toHaveBeenCalled();
  });

  it("quand tous les explorateurs sont déjà partis, lit l'heure du prochain retour sur le Territoire de la garde, pour le message", async () => {
    connecte();
    explorateurs.explorateursDuTerritoire.mockResolvedValueOnce({ libres: 0, total: 2 });
    // Une valeur simulée : les départs, et donc les retours, arrivent avec US-0911.
    explorateurs.prochainRetourDUnExplorateur.mockResolvedValueOnce(new Date("2026-10-09T12:05:00Z"));
    const html = await ouvrir();
    expect(explorateurs.prochainRetourDUnExplorateur).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12);
    expect(html).toMatch(new RegExp(`<h1[^>]*>Nouvelle Expédition</h1>${donne({ total: 2, prochainRetour: "2026-10-09T12:05:00.000Z" })}</main>$`));
    expect(html).not.toContain("data-partir");
  });

  it("garde le formulaire dès un explorateur libre, sans chercher de retour", async () => {
    connecte();
    const html = await ouvrir();
    expect(explorateurs.prochainRetourDUnExplorateur).not.toHaveBeenCalled();
    expect(html).not.toContain("data-aucun");
    expect(textes(html).slice(0, 4)).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte"]);
    expect(html).toContain(donne({ libres: 2, total: 3 }).replace("data-aucun", "data-explorateurs"));
    expect(html).toMatch(/<i data-partir="[^"]*"><\/i><\/main>$/);
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
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Cette Case appartient à un Territoire.", "Choisir sur la carte", ...SEJOUR]);
    expect(html).not.toMatch(/Biome|Distance|Aucune destination/);
    expect(lien(html, "Choisir sur la carte")).toBe("/jeu/carte?choix=destination");
  });

  it("refuse de même une Case hors de portée, demandée par son adresse sans passer par la carte (US-0908)", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ refus: "Cette Case est hors de portée." });
    const html = await ouvrir({ q: "0", r: "0" });
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Cette Case est hors de portée.", "Choisir sur la carte", ...SEJOUR]);
    expect(lien(html, "Choisir sur la carte")).toBe("/jeu/carte?choix=destination");
  });
});

describe("l'escorte de l'écran d'Expédition (US-0904)", () => {
  afterEach(() => {
    effectif.betesDisponibles.mockClear();
    destinations.destinationDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };
  /** Ce que la page donne à un bloc, tel qu'elle le rend. */
  const donne = (nom: string, valeur: object) => `<i data-${nom}="${JSON.stringify(valeur).replaceAll('"', "&quot;")}"></i>`;
  const SOURIS = { id: "souris", nom: "Souris grise", illustration: "especes/souris.webp", disponibles: 3 };

  it("propose les Bêtes disponibles du Territoire de la garde, juste après les explorateurs, avant le séjour (US-0906)", async () => {
    connecte();
    destinations.destinationDUneCase.mockResolvedValue({ fiche: FORET });
    const html = await ouvrir({ q: "3", r: "-5" });
    expect(effectif.betesDisponibles).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12);
    const [avant, apres] = html.split(donne("escorte", { especes: [SOURIS] }));
    expect(avant).toMatch(new RegExp(`${donne("explorateurs", { libres: 2, total: 3 })}$`));
    expect(apres).toMatch(/^<section[^>]*><h2[^>]*>Séjour<\/h2>/);
  });

  it("ne propose pas d'escorte sans explorateur libre, ni à un chef sans Territoire : le message d'US-0903 remplace tout le formulaire", async () => {
    connecte();
    explorateurs.explorateursDuTerritoire.mockResolvedValueOnce({ libres: 0, total: 2 });
    expect(await ouvrir()).not.toContain("data-escorte");
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: null, recitLu: true });
    expect(await ouvrir()).not.toContain("data-escorte");
    // Rien n'est demandé à la base des Bêtes quand le formulaire n'est pas montré.
    expect(effectif.betesDisponibles).not.toHaveBeenCalled();
  });

  it("garde l'escorte choisie en allant choisir la destination sur la carte (US-0907)", async () => {
    connecte();
    expect(lien(await ouvrir({ escorte: ["poule.1", "souris.2"] }), "Choisir sur la carte")).toBe("/jeu/carte?choix=destination&escorte=poule.1&escorte=souris.2");
  });
});
