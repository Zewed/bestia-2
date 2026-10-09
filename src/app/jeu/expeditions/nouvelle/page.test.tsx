import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Fiche, FicheInconnue } from "@/monde/fiche";

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
const fiches = vi.hoisted(() => ({ ficheDUneCase: vi.fn(async (): Promise<Fiche | FicheInconnue | null> => null) }));
vi.mock("@/monde/fiche", () => fiches);
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
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import NouvelleExpedition, { metadata } from "./page";

/** L'écran d'Expédition ouvert avec `recherche` dans son adresse (« ?q=3&r=-5 » : { q: "3", r: "-5" }). */
const ouvrir = async (recherche: Record<string, string | string[]> = {}) =>
  renderToStaticMarkup(
    await NouvelleExpedition({ params: Promise.resolve({}), searchParams: Promise.resolve(recherche) } as PageProps<"/jeu/expeditions/nouvelle">),
  );
/** Les textes de la page, dans l'ordre de la lecture. */
const textes = (html: string) => html.replace(/<[^>]+>/g, "|").split("|").filter(Boolean);

/** Une forêt libre, à 7 Cases du Foyer. */
const FORET: Fiche = { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 7, anneau: 3 };

describe("l'écran d'Expédition (US-0901)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    fiches.ficheDUneCase.mockReset();
    fiches.ficheDUneCase.mockResolvedValue(null);
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
    fiches.ficheDUneCase.mockResolvedValue(FORET);
    const html = await ouvrir({ q: "3", r: "-5" });
    // Le Monde vient du Territoire de la garde, jamais de l'adresse, qui ne dit que la Case.
    expect(fiches.ficheDUneCase).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12, { q: 3, r: -5 });
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Biome", "Forêt", "Distance", "7 Cases de votre Foyer"]);
  });

  it("accorde la distance : « 1 Case de votre Foyer »", async () => {
    connecte();
    fiches.ficheDUneCase.mockResolvedValue({ ...FORET, distance: 1 });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toContain("1 Case de votre Foyer");
  });

  it("dit le Biome « inconnu » d'une Case encore sous le brouillard", async () => {
    connecte();
    fiches.ficheDUneCase.mockResolvedValue({ q: 3, r: -5, inconnue: true, distance: 12 });
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toEqual(["Nouvelle Expédition", "Destination", "Biome", "inconnu", "Distance", "12 Cases de votre Foyer"]);
  });

  it("ouverte depuis le menu, sans Case, n'a pas de destination, et mène à la carte pour en choisir une", async () => {
    connecte();
    const html = await ouvrir();
    expect(fiches.ficheDUneCase).not.toHaveBeenCalled();
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte"]);
    expect(html).toMatch(/<a [^>]*href="\/jeu\/carte"[^>]*>Choisir sur la carte<\/a>/);
  });

  it("n'a pas de destination pour une Case que l'adresse dit mal, sans rien demander à la base", async () => {
    connecte();
    const fausses: Record<string, string | string[]>[] = [{ q: "3" }, { r: "-5" }, { q: "trois", r: "-5" }, { q: "3.5", r: "-5" }, { q: "3", r: "1e3" }, { q: "9999999999", r: "0" }, { q: ["3", "4"], r: "-5" }];
    for (const recherche of fausses) {
      expect(textes(await ouvrir(recherche))).toContain("Aucune destination");
    }
    expect(fiches.ficheDUneCase).not.toHaveBeenCalled();
  });

  it("n'a pas de destination pour une Case que le Monde du joueur n'a pas, ni pour son propre Foyer (US-0907)", async () => {
    connecte();
    expect(textes(await ouvrir({ q: "999", r: "0" }))).toContain("Aucune destination");
    fiches.ficheDUneCase.mockResolvedValue({ ...FORET, q: 0, r: 0, biome: "Prairie", chef: "Ourse", aVous: true, distance: 0 });
    expect(textes(await ouvrir({ q: "0", r: "0" }))).toContain("Aucune destination");
  });

  it("n'ajoute aucune phrase d'explication : le titre, puis la destination", async () => {
    connecte();
    fiches.ficheDUneCase.mockResolvedValue(FORET);
    expect(textes(await ouvrir({ q: "3", r: "-5" }))).toHaveLength(6);
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
    expect(fiches.ficheDUneCase).not.toHaveBeenCalled();
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
    fiches.ficheDUneCase.mockResolvedValue(null);
  });

  const connecte = () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
  };
  /** Ce que la page donne au bloc Explorateurs, puis au départ, tel qu'elle le rend. */
  const donne = (nom: string, valeur: object) => `<i data-${nom}="${JSON.stringify(valeur).replaceAll('"', "&quot;")}"></i>`;

  it("propose les explorateurs du Territoire de la garde, libres sur total, juste après la destination", async () => {
    connecte();
    fiches.ficheDUneCase.mockResolvedValue(FORET);
    const html = await ouvrir({ q: "3", r: "-5" });
    expect(explorateurs.explorateursDuTerritoire).toHaveBeenCalledExactlyOnceWith(expect.anything(), 12);
    expect(html).toContain(`7 Cases de votre Foyer</dd></div></dl></section>${donne("explorateurs", { libres: 2, total: 3 })}`);
  });

  it("finit sur le départ, qui sait combien d'explorateurs sont libres, avec ou sans destination", async () => {
    connecte();
    expect(await ouvrir()).toMatch(new RegExp(`${donne("partir", { libres: 2 })}</main>$`));
    fiches.ficheDUneCase.mockResolvedValue(FORET);
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
    fiches.ficheDUneCase.mockResolvedValue(null);
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
    fiches.ficheDUneCase.mockResolvedValue(FORET);
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
    expect(textes(html)).toEqual(["Nouvelle Expédition", "Destination", "Aucune destination", "Choisir sur la carte"]);
  });
});
