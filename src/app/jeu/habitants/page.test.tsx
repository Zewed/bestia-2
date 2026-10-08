import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lireJeu } from "@/donnees/charger";
import { METIERS } from "@/donnees/jeux";

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
type Habitant = { id: number; prenom: string; metier: string | null; arriveLe: Date; etat: "libre" };
const PRENOMS = ["Arno", "Brune", "Cael"];
const UN_HABITANT = { metier: null, arriveLe: new Date("2026-10-07T08:00:00Z"), etat: "libre" as const };
const habitants = vi.hoisted(() => ({
  habitantsDuTerritoire: vi.fn(async (): Promise<Habitant[]> => []),
  placesDuTerritoire: vi.fn(async (): Promise<number> => 0),
  entretienDesHabitants: vi.fn(async (): Promise<{ habitants: number; parHabitant: number; parHeure: string }> => ({ habitants: 0, parHabitant: 2, parHeure: "0" })),
}));
vi.mock("@/monde/habitants", () => habitants);
type Metier = { id: string; nom: string; phrase: string; servira: string | null };
/** US-0307 : les huit Métiers tels que donnees/metiers.yaml les règle. */
const HUIT_METIERS: Metier[] = lireJeu(METIERS).map((m) => ({ id: m.id, nom: m.nom, phrase: m.phrase, servira: m.servira ?? null }));
const metiers = vi.hoisted(() => ({ lesMetiers: vi.fn(async (): Promise<Metier[]> => []) }));
vi.mock("@/monde/metiers", async (original) => ({ ...(await original<object>()), ...metiers }));
// US-0320 : les Stocks du Territoire, que la vraie garde lit après l'avoir mis à l'heure.
type Stock = import("@/monde/stocks").Stock;
const stocks = vi.hoisted(() => ({ stocksDuTerritoire: vi.fn(async (): Promise<Stock[]> => []) }));
vi.mock("@/monde/stocks", () => stocks);
// US-0323 : l'avertissement de famine que le Territoire retient, lu par la vraie garde ; rien de retenu ici.
vi.mock("@/monde/production", async (original) => ({ ...(await original<object>()), famineImminenteDepuis: vi.fn(async () => null) }));
const temps = vi.hoisted(() => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/temps/rattraper", () => temps);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("./actions", () => ({ donnerUnMetier: vi.fn(), retirerLeMetier: vi.fn(), ajouterAuMetier: vi.fn(), retirerDuMetier: vi.fn() }));
// US-0314 : l'adresse de la page, que la liste lit pour son filtre, dès le rendu sur le serveur.
const adresse = vi.hoisted(() => ({ recherche: "" }));
vi.mock("next/navigation", async (original) => ({ ...(await original<object>()), useSearchParams: () => new URLSearchParams(adresse.recherche) }));
// US-0308 : la vraie liste, observée pour voir ce que la page lui confie.
const liste = vi.hoisted(() => ({ ListeDesHabitants: vi.fn() }));
vi.mock("./ListeDesHabitants", async (original) => {
  const { ListeDesHabitants } = await original<typeof import("./ListeDesHabitants")>();
  liste.ListeDesHabitants.mockImplementation(ListeDesHabitants);
  return liste;
});

import Habitants, { metadata } from "./page";

/** US-0320 : un Stock tel que stocksDuTerritoire le lit, en texte, sans Entretien pris sur lui. */
const unStock = (id: string, famille: Stock["famille"], quantite: string, parHeure: string, limite = "1000.000000"): Stock => ({
  id,
  nom: id,
  famille,
  quantite,
  limite,
  parHeure,
  entretienParHeure: "0.000000",
  sources: [],
});
/** US-0320 : les quatre Stocks d'un Foyer en prairie (+8 Viande, +14 Végétaux, +4 Bois et Pierre), 100 de chaque. */
const STOCKS_DE_PRAIRIE: Stock[] = [
  unStock("viande", "nourriture", "100.000000", "8.000000"),
  unStock("vegetaux", "nourriture", "100.000000", "14.000000"),
  unStock("bois", "materiaux", "100.000000", "4.000000"),
  unStock("pierre", "materiaux", "100.000000", "4.000000"),
];

describe("page Habitants (US-0302, US-0303, US-0305, US-0306, US-0307, US-0308, US-0309, US-0310, US-0311, US-0312, US-0314, US-0315, US-0318, US-0320)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    adresse.recherche = "";
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    habitants.habitantsDuTerritoire.mockReset();
    habitants.placesDuTerritoire.mockReset();
    habitants.entretienDesHabitants.mockReset();
    metiers.lesMetiers.mockReset();
    stocks.stocksDuTerritoire.mockReset();
    temps.rattraper.mockClear();
  });

  /**
   * Un joueur connecté, ses `nombre` Habitants, la place de son Territoire (5 par défaut, celle du Foyer),
   * leur Entretien, 2 Nourriture par heure chacun, les huit Métiers, et les Stocks d'un Foyer en prairie.
   */
  const connecte = (nombre = 3, places = 5) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    habitants.habitantsDuTerritoire.mockResolvedValue(Array.from({ length: nombre }, (_, i) => ({ id: 40 + i, prenom: PRENOMS[i % 3], ...UN_HABITANT })));
    habitants.placesDuTerritoire.mockResolvedValue(places);
    habitants.entretienDesHabitants.mockResolvedValue({ habitants: nombre, parHabitant: 2, parHeure: String(2 * nombre) });
    metiers.lesMetiers.mockResolvedValue(HUIT_METIERS);
    stocks.stocksDuTerritoire.mockResolvedValue(STOCKS_DE_PRAIRIE);
  };
  /** US-0309 : la rangée des compteurs, la première liste de la page, telle qu'elle est écrite. */
  const rangeeDesEffectifs = (html: string) => html.match(/<ul[^>]*aria-label="Effectifs par Métier"[^>]*>.*?<\/ul>/)?.[0] ?? "";
  /** La liste des Habitants, juste après les compteurs, telle qu'elle est écrite. */
  const listeDesHabitants = (html: string) => html.match(/<ul[^>]*aria-label="Effectifs par Métier"[^>]*>.*?<\/ul>(<ul[^>]*>.*?<\/ul>)/)?.[1] ?? "";
  /** Le texte de chaque ligne d'Habitant, ses morceaux séparés par « · ». */
  const lignes = (html: string) =>
    [...listeDesHabitants(html).matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));
  /** Les morceaux de texte d'un bout de page, tels qu'on les lit (l'apostrophe y est écrite « &#x27; »). */
  const morceaux = (html: string) =>
    html
      .replace(/<[^>]+>/g, "|")
      .split("|")
      .filter(Boolean)
      .map((t) => t.replaceAll("&#x27;", "'"));
  /** US-0307 : le bloc Métiers, tel qu'il est écrit. */
  const blocMetiers = (html: string) => html.match(/<section[^>]*><h2[^>]*>Métiers<\/h2>.*?<\/section>/)?.[0] ?? "";
  /** US-0307 : chaque ligne du bloc Métiers, en ses morceaux de texte (l'icône, muette, n'en a pas). */
  const lignesMetiers = (html: string) =>
    [...blocMetiers(html).matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => morceaux(ligne.replace(/<div[^>]*><button.*?<\/button><\/div>/, "")).map((t) => t.trim()));
  /** US-0312 : sur chaque ligne du bloc Métiers, l'effectif entre « − » et « + », et ceux des deux boutons qui sont grisés. */
  const repartitions = (html: string) =>
    [...blocMetiers(html).matchAll(/<li[^>]*>.*?<strong[^>]*>(.*?)<\/strong><div[^>]*>(<button[^>]*>)−<\/button><span[^>]*>(\d+)<\/span>(<button[^>]*>)\+<\/button><\/div>/g)].map(
      ([, nom, moins, nombre, plus]) => [nom, Number(nombre), ...[moins, plus].map((bouton) => (bouton.includes("disabled") ? "grisé" : "actif"))],
    );
  /** US-0318 : la ligne du bloc Entretien, telle qu'on la lit. */
  const ligneEntretien = (html: string) => html.match(/<h2[^>]*>Entretien<\/h2><p[^>]*>(.*?)<\/p>/)?.[1].replace(/<[^>]+>/g, "");
  /** US-0320 : la ligne qui suit celle de l'Entretien, dans son bloc, telle qu'elle est écrite. */
  const tenue = (html: string) => html.match(/<h2[^>]*>Entretien<\/h2><p[^>]*>.*?<\/p>(<p[^>]*>.*?<\/p>)<\/section>/)?.[1];

  it("titre la page « Habitants », dans l'onglet comme sur la page", async () => {
    connecte();
    expect(metadata.title).toBe("Habitants");
    expect(renderToStaticMarkup(await Habitants())).toMatch(/<main[^>]*><h1[^>]*>Habitants<\/h1>/);
  });

  it("compte les Habitants du Territoire du joueur, dans un bloc Bento", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(habitants.habitantsDuTerritoire).toHaveBeenCalledWith(expect.anything(), 12);
    expect(html).toMatch(/<section[^>]*><div[^>]*><p[^>]*>3 Habitants sur 5 places<\/p><\/div><ul/);
  });

  it("dit combien de places le Territoire offre, lues pour le Territoire du joueur : « 3 Habitants sur 5 places » (US-0305)", async () => {
    connecte(3, 5);
    expect(renderToStaticMarkup(await Habitants())).toContain(">3 Habitants sur 5 places<");
    expect(habitants.placesDuTerritoire).toHaveBeenCalledWith(expect.anything(), 12);
    connecte(2, 9);
    expect(renderToStaticMarkup(await Habitants())).toContain(">2 Habitants sur 9 places<");
  });

  it("accorde la place : « 1 Habitant sur 1 place » (US-0305)", async () => {
    connecte(1, 1);
    expect(renderToStaticMarkup(await Habitants())).toContain(">1 Habitant sur 1 place<");
  });

  it("affiche « Plus de place » quand toute la place est prise, et pas avant (US-0305)", async () => {
    connecte(4, 5);
    expect(renderToStaticMarkup(await Habitants())).not.toContain("Plus de place");
    connecte(5, 5);
    expect(renderToStaticMarkup(await Habitants())).toMatch(/<p[^>]*>5 Habitants sur 5 places<\/p><p[^>]*>Plus de place<\/p>/);
    connecte(6, 5);
    expect(renderToStaticMarkup(await Habitants())).toContain(">Plus de place<");
  });

  it("montre chaque Habitant sur une ligne, sous leur nombre : son prénom, « Choisir un Métier » à la place de « sans Métier », et « libre » (US-0303, US-0308)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    // US-0309 : les compteurs passent entre les deux.
    expect(html).toMatch(/<p[^>]*>3 Habitants sur 5 places<\/p><\/div><ul[^>]*aria-label="Effectifs par Métier"[^>]*>.*?<\/ul><ul[^>]*>(<li[^>]*>.*?<\/li>){3}<\/ul><\/section>/);
    expect(lignes(html)).toEqual(["Arno · Choisir un Métier · libre", "Brune · Choisir un Métier · libre", "Cael · Choisir un Métier · libre"]);
  });

  it("montre le Métier d'un Habitant qui en a un, sur le bouton qui en choisit un autre (US-0310)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    const html = renderToStaticMarkup(await Habitants());
    expect(lignes(html)).toEqual(["Dara · Choisir un Métier · libre", "Elio · Chasseur · libre"]);
    expect([...listeDesHabitants(html).matchAll(/<button[^>]*aria-expanded="false"[^>]*>(.*?)<svg/g)].map(([, texte]) => texte)).toEqual(["Choisir un Métier", "Chasseur"]);
  });

  it("confie à la liste chaque Habitant avec le nom de son Métier, et les Métiers au choix, chacun avec son icône (US-0308)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    renderToStaticMarkup(await Habitants());
    expect(liste.ListeDesHabitants.mock.lastCall?.[0]).toEqual({
      habitants: [
        { id: 41, prenom: "Dara", metier: null, etat: "libre" },
        { id: 40, prenom: "Elio", metier: "Chasseur", etat: "libre" },
      ],
      metiers: HUIT_METIERS.map((m) => ({ id: m.id, nom: m.nom, icone: `/illustrations/metiers/${m.id}.webp` })),
    });
  });

  it("garde l'ordre de la lecture, qui range par Métier, ceux sans Métier en premier", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 42, prenom: "Joran", ...UN_HABITANT },
      { id: 40, prenom: "Fenn", ...UN_HABITANT, metier: "Bûcheron" },
      { id: 41, prenom: "Ilda", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    expect(lignes(renderToStaticMarkup(await Habitants())).map((l) => l.split(" · ")[0])).toEqual(["Joran", "Fenn", "Ilda"]);
  });

  it("ne montre pas de liste vide quand il n'y a aucun Habitant : US-0329, une phrase dit que des Voyageurs finiront par passer", async () => {
    connecte(0);
    expect(renderToStaticMarkup(await Habitants())).toMatch(
      /<section[^>]*--largeur:8[^>]*><div[^>]*><p[^>]*>0 Habitant sur 5 places<\/p><\/div><p[^>]*>Aucun Habitant pour l&#x27;instant\. Des Voyageurs finiront par passer aux portes\.<\/p><\/section>/,
    );
  });

  it("sans Habitant, ne compte rien d'autre : ni bandeau des sans Métier, ni compteurs à zéro, ni filtre (US-0329)", async () => {
    connecte(0);
    const html = renderToStaticMarkup(await Habitants());
    expect(morceaux(html)).toEqual([
      "Habitants",
      "0 Habitant sur 5 places",
      "Aucun Habitant pour l'instant. Des Voyageurs finiront par passer aux portes.",
      "Aux portes",
      "Historique",
      "Personne aux portes pour l'instant.",
      "Entretien",
      "0 Habitant × 2 Nourriture = ",
      "0 Nourriture par heure",
      "Nourriture assurée",
      "Métiers",
      ...HUIT_METIERS.flatMap((m) => [m.nom, "−", "0", "+", m.phrase, `Servira ${m.servira}.`]),
    ]);
    // Les seuls boutons : « − » et « + » de chaque Métier, tous grisés faute d'Habitant.
    expect(repartitions(html)).toEqual(HUIT_METIERS.map((m) => [m.nom, 0, "grisé", "grisé"]));
    expect([...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]).toHaveLength(2 * HUIT_METIERS.length);
  });

  it("accorde le nombre : « 1 Habitant », « 0 Habitant »", async () => {
    connecte(1);
    expect(renderToStaticMarkup(await Habitants())).toContain(">1 Habitant sur 5 places<");
    connecte(0);
    expect(renderToStaticMarkup(await Habitants())).toContain(">0 Habitant sur 5 places<");
  });

  it("n'ajoute aucune phrase d'explication, ni lien vers ce qui n'existe pas encore", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(morceaux(html)).toEqual([
      "Habitants",
      // US-0313 : le bandeau des Habitants sans Métier.
      ...["3 Habitants sans Métier", "Voir"],
      "3 Habitants sur 5 places",
      // US-0309 : les compteurs, chacun son nom et son nombre, après « Tous » (US-0314).
      ...["Tous", "Sans Métier ", "3"],
      ...HUIT_METIERS.flatMap((m) => [`${m.nom} `, "0"]),
      ...PRENOMS.flatMap((prenom) => [prenom, "Choisir un Métier", "libre"]),
      // US-0332 : la partie « Aux portes », quand personne n'attend ; US-0342 : son lien vers l'historique.
      "Aux portes",
      "Historique",
      "Personne aux portes pour l'instant.",
      "Entretien",
      "3 Habitants × 2 Nourriture = ",
      "6 Nourriture par heure",
      // US-0320
      "Nourriture assurée",
      "Métiers",
      // US-0312 : sur chaque ligne, l'effectif du Métier entre « − » et « + ».
      ...HUIT_METIERS.flatMap((m) => [m.nom, "−", "0", "+", m.phrase, `Servira ${m.servira}.`]),
    ]);
    expect(html).not.toMatch(/<(form|input|select)[ >]/);
    // Les seuls liens : le raccourci du bandeau vers les Habitants sans Métier (US-0313), puis l'historique des Voyageurs (US-0342).
    expect([...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map(([, attributs, texte]) => [attributs.match(/href="([^"]*)"/)?.[1], texte])).toEqual([
      ["/jeu/habitants?metier=sans", "Voir"],
      ["/jeu/habitants/voyageurs", "Historique"],
    ]);
    // Les seuls boutons : ceux qui filtrent la liste (US-0314), ceux qui donnent un Métier (US-0308), puis « − » et
    // « + » de chaque Métier (US-0312).
    expect([...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, bouton]) => morceaux(bouton))).toEqual([
      ["Tous"],
      ["Sans Métier ", "3"],
      ...HUIT_METIERS.map((m) => [`${m.nom} `, "0"]),
      ...PRENOMS.map(() => ["Choisir un Métier"]),
      ...HUIT_METIERS.flatMap(() => [["−"], ["+"]]),
    ]);
  });

  it("signale en haut de la page, sous le titre et au-dessus des blocs, les Habitants sans Métier, avec « Voir » qui mène à eux (US-0313)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(
      /<main[^>]*><h1[^>]*>Habitants<\/h1><p[^>]*><strong[^>]*>3 Habitants sans Métier<\/strong><a[^>]*href="\/jeu\/habitants\?metier=sans"[^>]*>Voir<\/a><\/p><div[^>]*><section[^>]*--largeur:8/,
    );
  });

  it("compte sur les Habitants de la liste même : « 1 Habitant sans Métier » (US-0313)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
      { id: 42, prenom: "Fenn", ...UN_HABITANT, metier: "Mineur" },
    ]);
    expect(renderToStaticMarkup(await Habitants())).toContain(">1 Habitant sans Métier<");
    expect(habitants.habitantsDuTerritoire).toHaveBeenCalledTimes(1);
  });

  it("n'a pas de bandeau quand tous les Habitants ont un Métier, ni sans Habitant (US-0313)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
      { id: 42, prenom: "Fenn", ...UN_HABITANT, metier: "Mineur" },
    ]);
    let html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(/<main[^>]*><h1[^>]*>Habitants<\/h1><div/);
    // Le seul lien qui reste : l'historique des Voyageurs (US-0342).
    expect([...html.matchAll(/<a [^>]*>(.*?)<\/a>/g)].map(([, texte]) => texte)).toEqual(["Historique"]);
    connecte(0);
    html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(/<main[^>]*><h1[^>]*>Habitants<\/h1><div/);
  });

  it("reste sur la page Habitants pour un joueur entré dans son Foyer : recharger la page y ramène", async () => {
    connecte();
    await expect(Habitants()).resolves.toBeTruthy();
  });

  it("montre d'abord le récit d'arrivée s'il ne l'a pas été (US-0160)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: 12, recitLu: false });
    await expect(Habitants()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
  });

  it("renvoie vers la connexion sans session, qui ramènera ensuite ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(Habitants()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fhabitants;") });
    expect(habitants.habitantsDuTerritoire).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Habitants()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });

  it("rassemble le nombre, la place et « Plus de place » dans l'en-tête du bloc, la liste à part, dessous (US-0306)", async () => {
    connecte(5, 5);
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(
      /<section[^>]*><div[^>]*><p[^>]*>5 Habitants sur 5 places<\/p><p[^>]*>Plus de place<\/p><\/div><ul[^>]*aria-label="Effectifs par Métier"[^>]*>.*?<\/ul><ul[^>]*>(<li[^>]*>.*?<\/li>){5}<\/ul><\/section>/,
    );
  });

  it("compte les effectifs par Métier juste sous l'en-tête, hors de la partie collée, au-dessus de la liste : « Sans Métier » puis les huit Métiers (US-0309)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(
      /<section[^>]*--largeur:8[^>]*><div[^>]*><p[^>]*>3 Habitants sur 5 places<\/p><\/div><ul[^>]*aria-label="Effectifs par Métier"[^>]*>(<li[^>]*>.*?<\/li>){10}<\/ul><ul/,
    );
    // « Tous » (US-0314) en tête, puis les compteurs.
    expect(morceaux(rangeeDesEffectifs(html)).join("|")).toBe(["Tous", "Sans Métier ", "3", ...HUIT_METIERS.flatMap((m) => [`${m.nom} `, "0"])].join("|"));
  });

  it("compte sur la lecture même de la liste : la somme des compteurs est le nombre d'Habitants (US-0309)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Fenn", ...UN_HABITANT, metier: "Chasseur" },
      { id: 43, prenom: "Ilda", ...UN_HABITANT, metier: "Chasseur" },
      { id: 42, prenom: "Joran", ...UN_HABITANT, metier: "Bûcheron" },
    ]);
    const compteurs = morceaux(rangeeDesEffectifs(renderToStaticMarkup(await Habitants())))
      .slice(1)
      .join("")
      .split(/(?<=\d)/);
    expect(compteurs).toEqual(["Sans Métier 1", "Explorateur 0", "Chasseur 2", "Cueilleur 0", "Bûcheron 1", "Mineur 0", "Chercheur 0", "Bâtisseur 0", "Éleveur 0"]);
    expect(habitants.habitantsDuTerritoire).toHaveBeenCalledTimes(1);
  });

  it("relit les Habitants à chaque affichage : après rechargement, deux appareils montrent les effectifs de la base, les mêmes partout (US-0315)", async () => {
    connecte();
    /** Les effectifs que montre un affichage de la page : en haut de la liste, puis dans le bloc Métiers. */
    const effectifsAffiches = async () => {
      const html = renderToStaticMarkup(await Habitants());
      return { compteurs: morceaux(rangeeDesEffectifs(html)).slice(1).join("").split(/(?<=\d)/), metiers: repartitions(html).map(([nom, nombre]) => `${nom} ${nombre}`) };
    };
    habitants.habitantsDuTerritoire.mockResolvedValue([{ id: 40, prenom: "Fenn", ...UN_HABITANT, metier: "Chasseur" }]);
    const avant = await effectifsAffiches();
    // L'autre appareil a remis Fenn sans Métier et donné un Métier à Ilda : la base a changé entre deux affichages.
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 40, prenom: "Fenn", ...UN_HABITANT },
      { id: 43, prenom: "Ilda", ...UN_HABITANT, metier: "Mineur" },
    ]);
    const [ordinateur, telephone] = [await effectifsAffiches(), await effectifsAffiches()];
    expect(avant.compteurs.slice(0, 3)).toEqual(["Sans Métier 0", "Explorateur 0", "Chasseur 1"]);
    expect(ordinateur).toEqual(telephone);
    expect(ordinateur.compteurs).toEqual(["Sans Métier 1", "Explorateur 0", "Chasseur 0", "Cueilleur 0", "Bûcheron 0", "Mineur 1", "Chercheur 0", "Bâtisseur 0", "Éleveur 0"]);
    expect(ordinateur.metiers).toEqual(ordinateur.compteurs.slice(1));
    expect(habitants.habitantsDuTerritoire).toHaveBeenCalledTimes(3);
  });

  it("rend la liste déjà filtrée quand l'adresse porte un filtre : recharger la page ou suivre un lien le garde (US-0314)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    adresse.recherche = "metier=chasseur";
    let html = renderToStaticMarkup(await Habitants());
    expect(lignes(html)).toEqual(["Elio · Chasseur · libre"]);
    expect(rangeeDesEffectifs(html)).toMatch(/<button[^>]*aria-pressed="true"[^>]*>.*?Chasseur <strong[^>]*>1<\/strong><\/button>/);
    expect(rangeeDesEffectifs(html).match(/aria-pressed="true"/g)).toHaveLength(1);
    adresse.recherche = "metier=sans";
    html = renderToStaticMarkup(await Habitants());
    expect(lignes(html)).toEqual(["Dara · Choisir un Métier · libre"]);
    // Le filtre ne touche qu'à la liste : les compteurs et les Métiers restent entiers.
    expect(morceaux(rangeeDesEffectifs(html)).slice(1, 5)).toEqual(["Sans Métier ", "1", "Explorateur ", "0"]);
    expect(lignesMetiers(html)).toHaveLength(8);
  });

  it("montre « Personne n'exerce ce Métier. » à la place de la liste quand l'adresse filtre sur un Métier que personne n'exerce (US-0314)", async () => {
    connecte();
    adresse.recherche = "metier=mineur";
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(/<ul[^>]*aria-label="Effectifs par Métier"[^>]*>.*?<\/ul><p[^>]*>Personne n&#x27;exerce ce Métier.<\/p><\/section>/);
  });

  it("ne filtre rien quand l'adresse porte un identifiant inconnu (US-0314)", async () => {
    connecte();
    adresse.recherche = "metier=druide";
    const html = renderToStaticMarkup(await Habitants());
    expect(lignes(html)).toHaveLength(3);
    expect(rangeeDesEffectifs(html)).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Tous<\/button>/);
  });

  it("affiche l'Entretien total par heure, détaillé en une ligne : « 3 Habitants × 2 Nourriture = 6 Nourriture par heure » (US-0318)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(habitants.entretienDesHabitants).toHaveBeenCalledWith(expect.anything(), 12);
    expect(ligneEntretien(html)).toBe("3 Habitants × 2 Nourriture = 6 Nourriture par heure");
    // Le total ressort de la ligne.
    expect(html).toMatch(/= <strong[^>]*>6 Nourriture par heure<\/strong><\/p>/);
  });

  it("met l'Entretien à côté de la liste sur ordinateur, dessous sur mobile, dans un bloc à lui (US-0318)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    // US-0332 : sous « Aux portes », en tête de la colonne. US-0313 : les blocs suivent le bandeau des sans Métier.
    expect(html).toMatch(/<main[^>]*><h1[^>]*>Habitants<\/h1><p[^>]*>.*?<\/p><div[^>]*><section[^>]*--largeur:8[^>]*>.*?<\/ul><\/section><div[^>]*--largeur:4[^>]*><section[^>]*><h2[^>]*>Aux portes<\/h2>.*?<\/section><section[^>]*><h2[^>]*>Entretien<\/h2>/);
  });

  it("relit l'Entretien à chaque affichage : il suit chaque arrivée et chaque départ (US-0318)", async () => {
    connecte(4);
    expect(ligneEntretien(renderToStaticMarkup(await Habitants()))).toBe("4 Habitants × 2 Nourriture = 8 Nourriture par heure");
    connecte(1);
    expect(ligneEntretien(renderToStaticMarkup(await Habitants()))).toBe("1 Habitant × 2 Nourriture = 2 Nourriture par heure");
    connecte(0);
    expect(ligneEntretien(renderToStaticMarkup(await Habitants()))).toBe("0 Habitant × 2 Nourriture = 0 Nourriture par heure");
    expect(habitants.entretienDesHabitants).toHaveBeenCalledTimes(3);
  });

  it("montre le total que rend la lecture, celle du calcul, exact et à la française (US-0318)", async () => {
    connecte();
    habitants.entretienDesHabitants.mockResolvedValue({ habitants: 3, parHabitant: 1.5, parHeure: "4.500000" });
    expect(ligneEntretien(renderToStaticMarkup(await Habitants()))).toBe("3 Habitants × 1,5 Nourriture = 4,5 Nourriture par heure");
  });

  it("dit « Nourriture assurée » sous la ligne d'Entretien quand la production la couvre, ou tout juste (US-0320)", async () => {
    connecte();
    expect(tenue(renderToStaticMarkup(await Habitants()))).toMatch(/^<p[^>]*>Nourriture assurée<\/p>$/);
    // 11 Habitants : 22 d'Entretien pour 8 + 14 de production, un solde nul.
    connecte(11);
    expect(tenue(renderToStaticMarkup(await Habitants()))).toMatch(/>Nourriture assurée</);
  });

  it("dit combien de temps la Nourriture tiendra quand elle baisse : douze Habitants en prairie, « Nourriture pour encore 4 j 4 h » (US-0320)", async () => {
    // La Viande baisse de 4 par heure, les Végétaux montent de 2 : la Viande se vide en 25 h, puis les Végétaux, à 150, en 75 h.
    connecte(12);
    const html = renderToStaticMarkup(await Habitants());
    expect(tenue(html)).toMatch(/^<p[^>]*data-baisse=""[^>]*>Nourriture pour encore 4 j 4 h<\/p>$/);
  });

  it("compte avec les Stocks, la production et l'Entretien du moment, lus pour le Territoire du joueur une fois mis à l'heure (US-0320)", async () => {
    connecte(12);
    stocks.stocksDuTerritoire.mockResolvedValue([
      unStock("viande", "nourriture", "20.000000", "8.000000"),
      unStock("vegetaux", "nourriture", "7.500000", "14.000000"),
      ...STOCKS_DE_PRAIRIE.slice(2),
    ]);
    // La Viande se vide en 5 h ; les Végétaux, à 17,5, baissent alors de 2 par heure : 8 h 45 de plus.
    expect(tenue(renderToStaticMarkup(await Habitants()))).toContain(">Nourriture pour encore 13 h<");
    expect(stocks.stocksDuTerritoire).toHaveBeenCalledWith(expect.anything(), 12);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 12);
    expect(temps.rattraper.mock.invocationCallOrder[0]).toBeLessThan(stocks.stocksDuTerritoire.mock.invocationCallOrder[0]);
  });

  it("dit « moins d'une heure » quand la Nourriture est presque épuisée (US-0320)", async () => {
    connecte(12);
    stocks.stocksDuTerritoire.mockResolvedValue([
      unStock("viande", "nourriture", "0.000000", "8.000000"),
      unStock("vegetaux", "nourriture", "1.500000", "14.000000"),
      ...STOCKS_DE_PRAIRIE.slice(2),
    ]);
    expect(tenue(renderToStaticMarkup(await Habitants()))).toContain(">Nourriture pour encore moins d&#x27;une heure<");
  });

  it("liste les huit Métiers dans un bloc « Métiers », une ligne chacun : son icône, son nom, sa phrase et quand il servira (US-0307)", async () => {
    connecte();
    const lus = lignesMetiers(renderToStaticMarkup(await Habitants()));
    expect(lus.map(([nom]) => nom)).toEqual(["Explorateur", "Chasseur", "Cueilleur", "Bûcheron", "Mineur", "Chercheur", "Bâtisseur", "Éleveur"]);
    expect(lus[3]).toEqual(["Bûcheron", "rapporte du Bois des forêts", "Servira avec les Récoltes."]);
    expect(lus[5]).toEqual(["Chercheur", "fait avancer la Recherche", "Servira quand le cercle des sages sera bâti."]);
    expect(lus).toEqual(HUIT_METIERS.map((m) => [m.nom, m.phrase, `Servira ${m.servira}.`]));
  });

  it("montre l'icône peinte de chaque Métier, en petit et muette (le nom est à côté), puis le nom en gras, sa phrase dessous (US-0307, US-0312)", async () => {
    connecte();
    const bloc = blocMetiers(renderToStaticMarkup(await Habitants()));
    for (const m of HUIT_METIERS) {
      const icone = bloc.match(new RegExp(`<img[^>]*${encodeURIComponent(`/illustrations/metiers/${m.id}.webp`)}[^>]*>`))?.[0] ?? "";
      expect(icone, m.id).toContain('alt=""');
      expect(icone, m.id).toContain('width="40"');
      expect(icone, m.id).toContain(encodeURIComponent(`/illustrations/metiers/${m.id}.webp`));
    }
    expect(bloc).toMatch(/<strong[^>]*>Bûcheron<\/strong><div[^>]*>.*?<\/div><div[^>]*><p[^>]*>rapporte du Bois des forêts<\/p>/);
  });

  it("met sur chaque ligne de Métier son effectif entre « − » et « + », compté sur la lecture même de la liste, et les grise quand ils ne peuvent servir (US-0312)", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Fenn", ...UN_HABITANT, metier: "Chasseur" },
      { id: 43, prenom: "Ilda", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    let html = renderToStaticMarkup(await Habitants());
    expect(repartitions(html)).toEqual(HUIT_METIERS.map((m) => (m.nom === "Chasseur" ? [m.nom, 2, "actif", "actif"] : [m.nom, 0, "grisé", "actif"])));
    // Chaque bouton dit à un lecteur d'écran ce qu'il fait.
    expect(blocMetiers(html)).toMatch(/<button[^>]*aria-label="Un Chasseur de moins"[^>]*>−<\/button>/);
    expect(blocMetiers(html)).toMatch(/<button[^>]*aria-label="Un Chasseur de plus"[^>]*>\+<\/button>/);
    // Plus personne sans Métier : « + » est grisé partout.
    habitants.habitantsDuTerritoire.mockResolvedValue([{ id: 40, prenom: "Fenn", ...UN_HABITANT, metier: "Mineur" }]);
    html = renderToStaticMarkup(await Habitants());
    expect(repartitions(html)).toEqual(HUIT_METIERS.map((m) => (m.nom === "Mineur" ? [m.nom, 1, "actif", "grisé"] : [m.nom, 0, "grisé", "grisé"])));
  });

  it("lit les Métiers une fois par affichage, et les montre dans l'ordre de la lecture (US-0307)", async () => {
    connecte();
    metiers.lesMetiers.mockResolvedValue([HUIT_METIERS[4], HUIT_METIERS[0]]);
    const html = renderToStaticMarkup(await Habitants());
    expect(metiers.lesMetiers).toHaveBeenCalledTimes(1);
    expect(lignesMetiers(html).map(([nom]) => nom)).toEqual(["Mineur", "Explorateur"]);
  });

  it("ne dit rien de plus d'un Métier qui sert déjà (US-0307)", async () => {
    connecte();
    metiers.lesMetiers.mockResolvedValue([{ ...HUIT_METIERS[3], servira: null }, HUIT_METIERS[4]]);
    const html = renderToStaticMarkup(await Habitants());
    expect(lignesMetiers(html)).toEqual([
      ["Bûcheron", "rapporte du Bois des forêts"],
      ["Mineur", "rapporte de la Pierre des montagnes", "Servira avec les Récoltes."],
    ]);
  });

  it("ne montre pas de bloc Métiers vide (US-0307)", async () => {
    connecte();
    metiers.lesMetiers.mockResolvedValue([]);
    expect(renderToStaticMarkup(await Habitants())).not.toContain(">Métiers<");
  });

  it("met les Métiers sous l'Entretien, dans la colonne à côté de la liste sur ordinateur, à la suite sur mobile (US-0307)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(
      // US-0332 : sous « Aux portes » et l'Entretien.
      /<\/ul><\/section><div[^>]*--largeur:4[^>]*><section[^>]*><h2[^>]*>Aux portes<\/h2>.*?<\/section><section[^>]*><h2[^>]*>Entretien<\/h2>.*?<\/section><section[^>]*><h2[^>]*>Métiers<\/h2><ul[^>]*>(<li[^>]*>.*?<\/li>){8}<\/ul><\/section><\/div><\/div><\/main>$/,
    );
  });
});

describe("page Habitants au pouce (US-0306)", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
  const css = lire("src/app/jeu/habitants/page.module.css");
  /** Les déclarations d'une règle, dans `texte` (toute la feuille par défaut). */
  const regle = (selecteur: string, texte = css) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";
  const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));

  it("sur mobile, tient sur une seule colonne, sans défilement de côté", () => {
    // Chaque ligne se resserre : le prénom et le Métier l'un sous l'autre, l'état à droite, rien qui impose sa largeur.
    expect(css).toContain("@media (max-width: 820px)");
    expect(regle(".habitant", mobile)).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    for (const [, colonnes] of css.matchAll(/grid-template-columns: ([^;]+);/g)) {
      expect(colonnes.split(/ (?![^(]*\))/).every((c) => c === "auto" || c.startsWith("minmax(0,")), colonnes).toBe(true);
    }
    // Aucune largeur fixe plus grande qu'une surface de toucher, aucun texte qui refuse d'aller à la ligne.
    for (const [, largeur] of css.matchAll(/(?<![\w-])(?:min-)?width: (\d+)px/g)) expect(Number(largeur)).toBeLessThanOrEqual(44);
    expect(css).not.toContain("nowrap");
    expect(regle(".entete")).toContain("flex-wrap: wrap;");
  });

  it("donne à chaque bouton une surface de toucher d'au moins 44 px de côté, sur tous les écrans", () => {
    const bouton = regle(".page button");
    expect(bouton).toContain("min-width: 44px;");
    expect(bouton).toContain("min-height: 44px;");
    expect(css.indexOf(".page button {")).toBeLessThan(css.indexOf("@media"));
  });

  it("empile l'Entretien et les Métiers dans leur colonne, chacun à sa hauteur, sans grille de cartes (US-0307)", () => {
    const colonne = regle(".colonne");
    expect(colonne).toContain("display: grid;");
    expect(colonne).toContain("align-content: start;");
    expect(regle(".colonne", mobile)).toContain("gap: var(--ecart-mobile);");
    // La liste ne s'étire pas à la hauteur de la colonne, plus haute qu'elle.
    expect(regle(".liste")).toContain("align-self: start;");
    // Une ligne par Métier : l'icône, le nom qui va à la ligne, puis « − » et « + » (US-0312) ; dessous, sur toute la
    // largeur qui reste, la phrase et « Servira » en discret.
    expect(regle(".ligneMetier")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(regle(".descriptionMetier")).toContain("grid-column: 2 / -1;");
    expect(regle(".servira")).toContain("color: var(--texte-discret);");
  });

  it("met « − » et « + » au pouce sur chaque ligne de Métier : 44 px de côté au moins, écartés de 8 px au moins, grisés quand ils ne servent pas (US-0312)", () => {
    // La surface de toucher vient de la règle commune à tous les boutons de la page.
    expect(regle(".page button")).toContain("min-width: 44px;");
    const repartition = regle(".repartition");
    expect(repartition).toContain("display: flex;");
    expect(Number(repartition.match(/gap: (\d+)px;/)?.[1])).toBeGreaterThanOrEqual(8);
    const plusMoins = regle(".plusMoins");
    expect(plusMoins).toContain("cursor: pointer;");
    expect(plusMoins).toContain("font: inherit;");
    const grise = regle(".plusMoins:disabled");
    expect(grise).toContain("color: var(--galet);");
    expect(grise).toContain("cursor: default;");
    expect(regle(".plusMoins:focus-visible")).toContain("outline: 2px solid var(--encre);");
    // Passer de 9 à 10 ne pousse pas « + ».
    const effectif = regle(".effectifMetier");
    expect(effectif).toContain("font-variant-numeric: tabular-nums;");
    expect(effectif).toContain("min-width: 2ch;");
  });

  it("déplie les Métiers au choix sous la ligne, sur toute sa largeur, en une grille qui passe à la ligne : deux colonnes sur un petit écran (US-0308)", () => {
    const choix = regle(".choix");
    expect(choix).toContain("grid-column: 1 / -1;");
    expect(choix).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);");
    const petit = css.slice(css.indexOf("@media (max-width: 540px)"));
    expect(regle(".choix", petit)).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);");
    // Chaque Métier, son icône au-dessus de son nom, pour tenir à deux par ligne sur 320 px.
    expect(regle(".metierAuChoix")).toContain("flex-direction: column;");
    expect(regle(".iconeAuChoix")).toContain("width: 28px;");
  });

  it("marque dans le dépliant le Métier que l'Habitant exerce, en Encre comme un filtre pressé, sans réagir au survol (US-0310)", () => {
    const actuel = regle('.metierAuChoix[aria-pressed="true"]');
    expect(actuel).toContain("background: var(--encre);");
    expect(actuel).toContain("color: var(--ivoire);");
    expect(actuel).toContain("cursor: default;");
    expect(css).toMatch(/\.metierAuChoix:enabled:hover[ ,]/);
    expect(css).not.toMatch(/\.metierAuChoix:hover/);
  });

  it("met « Sans Métier » en dernier dans le dépliant, sur toute sa largeur, en pointillés pour ne pas le confondre avec un Métier (US-0311)", () => {
    const sansMetier = regle(".sansMetierAuChoix");
    // Un bouton ne s'étire pas dans sa grille sans être lui-même une boîte flexible.
    expect(sansMetier).toContain("display: flex;");
    expect(sansMetier).toContain("grid-column: 1 / -1;");
    expect(sansMetier).toContain("border: 1px dashed var(--galet);");
    expect(sansMetier).toContain("cursor: pointer;");
    expect(sansMetier).toContain("font: inherit;");
    expect(css).toMatch(/\.sansMetierAuChoix:hover/);
    expect(css).toMatch(/\.sansMetierAuChoix:focus-visible/);
  });

  it("fait passer les compteurs à la ligne sur un écran étroit, chacun son icône à sa taille, et rien qui ne colle au défilement (US-0309)", () => {
    const effectifs = regle(".effectifs");
    expect(effectifs).toContain("display: flex;");
    expect(effectifs).toContain("flex-wrap: wrap;");
    expect(effectifs).not.toContain("sticky");
    expect(regle(".iconeEffectif")).toContain("width: 22px;");
    // Les chiffres ont tous la même largeur : passer de 1 à 2 ne pousse pas les compteurs suivants.
    expect(regle(".nombreEffectif")).toContain("font-variant-numeric: tabular-nums;");
  });

  it("fait de chaque compteur un bouton au pouce, le filtre pressé en Encre, lisible sans la couleur (US-0314)", () => {
    // La surface de toucher vient de la règle commune à tous les boutons de la page.
    expect(regle(".page button")).toContain("min-height: 44px;");
    const effectif = regle(".effectif");
    expect(effectif).toContain("cursor: pointer;");
    expect(effectif).toContain("font: inherit;");
    const presse = regle('.effectif[aria-pressed="true"]');
    expect(presse).toContain("background: var(--encre);");
    expect(presse).toContain("color: var(--ivoire);");
    expect(regle(".effectif:focus-visible")).toContain("outline: 2px solid var(--encre);");
    // Un filtre sans personne : la phrase à la place de la liste, en discret.
    expect(regle(".personne")).toContain("color: var(--texte-discret);");
  });

  it("pose le bandeau des sans Métier sur le sable, sans rien de criard, son lien « Voir » au pouce (US-0313)", () => {
    const bandeau = regle(".sansMetier");
    expect(bandeau).toContain("background: var(--sable);");
    expect(bandeau).toContain("color: var(--encre);");
    expect(bandeau).toContain("flex-wrap: wrap;");
    expect(bandeau).not.toMatch(/animation|var\(--mauvais\)|var\(--rose\)/);
    const voir = regle(".voirSansMetier");
    expect(voir).toContain("min-height: 44px;");
    expect(voir).toContain("text-decoration: underline;");
    expect(regle(".voirSansMetier:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });

  it("met la tenue de la Nourriture en gras, dans la couleur d'alerte quand elle baisse (US-0320)", () => {
    const tenue = regle(".tenue");
    expect(tenue).toContain("font-weight: var(--graisse-titre);");
    expect(tenue).toContain("color: var(--bon);");
    expect(regle(".tenue[data-baisse]")).toContain("color: var(--mauvais);");
  });

  it("garde le nombre d'Habitants et la place en haut de la page au défilement, collés sous la barre du haut", () => {
    const entete = regle(".entete");
    expect(entete).toContain("position: sticky;");
    // La barre du haut, bande des ressources et encoche comprises sur mobile (formes.css).
    expect(entete).toContain("top: var(--hauteur-barre);");
    // La liste passe dessous sans se voir au travers.
    expect(entete).toContain("background: var(--bloc);");
    // Rien ne coupe le bloc qui le porte : un bloc qui rognerait son contenu le décollerait.
    const bloc = regle(".bloc", lire("src/components/Bloc.module.css"));
    expect(bloc).toContain("background: var(--bloc);");
    expect(bloc).not.toContain("overflow:");
  });
});

// US-0332 : les Voyageurs aux portes, lus pour la page, et US-0333 : la partie qui les montre, observée pour voir
// ce que la page lui confie (vitest remonte ces appels en tête du fichier).
type Voyageur = { id: number; prenom: string; arriveLe: Date; departLe: Date };
const voyageurs = vi.hoisted(() => ({ voyageursAuxPortes: vi.fn(async (): Promise<Voyageur[]> => []) }));
vi.mock("@/monde/voyageurs", async (original) => ({ ...(await original<object>()), ...voyageurs }));
const portes = vi.hoisted(() => ({ AuxPortes: vi.fn() }));
vi.mock("./AuxPortes", async (original) => {
  const { AuxPortes } = await original<typeof import("./AuxPortes")>();
  portes.AuxPortes.mockImplementation(AuxPortes);
  return portes;
});

describe("page Habitants, les Voyageurs aux portes (US-0332, US-0333)", () => {
  afterEach(async () => {
    voyageurs.voyageursAuxPortes.mockReset();
    metiers.lesMetiers.mockReset();
    stocks.stocksDuTerritoire.mockReset();
    (await import("@/temps/horloge")).definirAncre(null);
  });

  const HEURE = 3_600_000;
  /**
   * Un joueur connecté, ses trois Habitants, les huit Métiers et ces Voyageurs aux portes, arrivés il y a tant
   * d'heures, chacun avec son départ tel que le jeu le calcule.
   */
  const connecte = async (...attentes: [prenom: string, heures: number][]) => {
    const { departDuVoyageur } = await import("@/monde/voyageurs");
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    habitants.habitantsDuTerritoire.mockResolvedValue(PRENOMS.map((prenom, i) => ({ id: 40 + i, prenom, ...UN_HABITANT })));
    habitants.placesDuTerritoire.mockResolvedValue(5);
    habitants.entretienDesHabitants.mockResolvedValue({ habitants: 3, parHabitant: 2, parHeure: "6" });
    metiers.lesMetiers.mockResolvedValue(HUIT_METIERS);
    // Une demi-minute de plus : le temps du test passe sans changer l'heure entière affichée.
    const arrivees = attentes.map(([prenom, heures], i) => ({ id: 70 + i, prenom, arriveLe: new Date(Date.now() - heures * HEURE - 30_000) }));
    voyageurs.voyageursAuxPortes.mockResolvedValue(arrivees.map((v) => ({ ...v, departLe: departDuVoyageur(v.arriveLe) })));
  };
  /** La partie « Aux portes », telle qu'elle est écrite. */
  const auxPortes = (html: string) => html.match(/<section[^>]*><h2[^>]*>Aux portes<\/h2>.*?<\/section>/)?.[0] ?? "";
  /** Le texte de chaque ligne de la partie « Aux portes », ses morceaux séparés par « · ». */
  const lignesAuxPortes = (html: string) =>
    [...auxPortes(html).matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));

  it("montre chaque Voyageur qui attend aux portes du Territoire du joueur, dans l'ordre de la lecture, depuis quand il attend et, US-0333, dans combien de temps il repart", async () => {
    await connecte(["Joran", 5], ["Ilda", 2]);
    const html = renderToStaticMarkup(await Habitants());
    expect(voyageurs.voyageursAuxPortes).toHaveBeenCalledWith(expect.anything(), 12);
    // US-0334, US-0336 : chaque ligne finit par « Accueillir » et « Refuser » ; US-0340 : puis l'Entretien en plus.
    expect(lignesAuxPortes(html)).toEqual([
      "Joran · arrivé il y a 5 h · repart dans 7 h · Accueillir · Refuser · Mangera 2 Nourriture par heure",
      "Ilda · arrivé il y a 2 h · repart dans 10 h · Accueillir · Refuser · Mangera 2 Nourriture par heure",
    ]);
  });

  it("confie au compte à rebours l'heure et la vitesse du jeu, telles que le serveur les tient (US-0333)", async () => {
    const { definirAncre } = await import("@/temps/horloge");
    const jeu = Date.parse("2026-10-07T18:00:00Z");
    definirAncre({ facteur: 100, reel: Date.now(), jeu });
    await connecte(["Joran", 5]);
    renderToStaticMarkup(await Habitants());
    const { voyageurs: confies, maintenant, vitesse } = portes.AuxPortes.mock.lastCall?.[0] ?? {};
    expect(confies).toEqual(await voyageurs.voyageursAuxPortes.mock.results[0].value);
    expect(vitesse).toBe(100);
    expect(maintenant.getTime() - jeu).toBeGreaterThanOrEqual(0);
    expect(maintenant.getTime() - jeu).toBeLessThan(100 * 5_000);
  });

  it("confie à « Aux portes » la place qui reste au Foyer, grisant « Accueillir » quand elle est toute prise (US-0338)", async () => {
    await connecte(["Joran", 5]);
    renderToStaticMarkup(await Habitants());
    expect(portes.AuxPortes.mock.lastCall?.[0].placesLibres).toBe(2);
    habitants.placesDuTerritoire.mockResolvedValue(3);
    const html = auxPortes(renderToStaticMarkup(await Habitants()));
    expect(portes.AuxPortes.mock.lastCall?.[0].placesLibres).toBe(0);
    expect(html).toContain("Plus de place au Foyer. Des huttes en ajouteront quand les constructions seront là.");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Accueillir<\/button>/);
  });

  it("confie à « Aux portes » l'avertissement « famine imminente », compté comme la bande d'alerte sur les Stocks et l'Entretien lus à l'heure (US-0340)", async () => {
    await connecte(["Joran", 5]);
    renderToStaticMarkup(await Habitants());
    // Trois Habitants en prairie : la Nourriture est assurée.
    expect(portes.AuxPortes.mock.lastCall?.[0].famineImminente).toBe(false);
    // Douze Habitants, la Viande vide : les Végétaux tiennent 13 h, puis 12 h, au seuil.
    habitants.entretienDesHabitants.mockResolvedValue({ habitants: 12, parHabitant: 2, parHeure: "24.000000" });
    for (const [vegetaux, avertissement] of [
      ["26.000000", false],
      ["24.000000", true],
    ] as const) {
      stocks.stocksDuTerritoire.mockResolvedValue([unStock("viande", "nourriture", "0.000000", "8.000000"), unStock("vegetaux", "nourriture", vegetaux, "14.000000")]);
      renderToStaticMarkup(await Habitants());
      expect(portes.AuxPortes.mock.lastCall?.[0].famineImminente, vegetaux).toBe(avertissement);
    }
    expect(stocks.stocksDuTerritoire).toHaveBeenLastCalledWith(expect.anything(), 12);
  });

  it("affiche « Personne aux portes pour l'instant. » quand personne n'attend", async () => {
    await connecte();
    // US-0342 : entre le titre et la phrase, le lien vers l'historique.
    expect(auxPortes(renderToStaticMarkup(await Habitants()))).toMatch(
      /<h2[^>]*>Aux portes<\/h2><a[^>]*href="\/jeu\/habitants\/voyageurs"[^>]*>Historique<\/a><p[^>]*>Personne aux portes pour l&#x27;instant\.<\/p><\/section>$/,
    );
  });

  it("met « Aux portes » en tête de la colonne, avant l'Entretien et les Métiers, à côté de la liste sur ordinateur", async () => {
    await connecte(["Joran", 5]);
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(/<\/ul><\/section><div[^>]*--largeur:4[^>]*><section[^>]*><h2[^>]*>Aux portes<\/h2>.*?<\/section><section[^>]*><h2[^>]*>Entretien<\/h2>/);
  });

  it("fait remonter « Aux portes » au-dessus de la liste dès que la colonne passe dessous, sous 1 100 px", () => {
    const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
    const [css, page] = [lire("src/app/jeu/habitants/AuxPortes.module.css"), lire("src/app/jeu/habitants/page.module.css")];
    /** Les déclarations de la règle `selecteur` dans `texte`, à partir du bloc @media `media`. */
    const dans = (texte: string, media: string, selecteur: string) =>
      texte.slice(texte.indexOf(media)).match(new RegExp(`\\n\\s*${selecteur.replace(/[.*+?^${}()|[\]\\>]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";
    expect(dans(css, "@media (max-width: 1100px)", ".auxPortes")).toContain("order: -1;");
    // Les blocs de la colonne se rangent alors dans la grille de la page, chacun à la place que la colonne
    // leur donnait : une demi-ligne sur tablette, toute la largeur sur mobile.
    expect(dans(page, "@media (max-width: 1100px)", ".colonne")).toContain("display: contents;");
    expect(dans(page, "@media (max-width: 1100px)", ".colonne > *")).toContain("grid-column: 1 / span 6;");
    expect(dans(page, "@media (max-width: 820px) {\n  .colonne > *", ".colonne > *")).toContain("grid-column: 1 / -1;");
  });

  it("met le compte à rebours qui s'achève dans la couleur d'alerte de la page, et le garde au bout de la ligne sans la déborder (US-0333)", () => {
    const css = readFileSync(join(process.cwd(), "src/app/jeu/habitants/AuxPortes.module.css"), "utf8");
    expect(css).toMatch(/\n\.depart\[data-alerte\] \{[^}]*color: var\(--mauvais\);/);
    expect(css).toMatch(/\n\.depart \{[^}]*grid-column: 2;[^}]*font-variant-numeric: tabular-nums;/);
    // Le prénom prend la place qui reste ; le compte va à la ligne plutôt que de pousser la page de côté.
    expect(css).toMatch(/\n\.voyageur \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(css).not.toContain("nowrap");
  });

  it("met « Accueillir » et « Refuser » sous la ligne, sur toute sa largeur, en boutons écartés d'au moins 44 px de haut qui ne la débordent pas (US-0334, US-0336)", () => {
    const css = readFileSync(join(process.cwd(), "src/app/jeu/habitants/AuxPortes.module.css"), "utf8");
    expect(css).toMatch(/\n\.choix \{[^}]*grid-column: 1 \/ -1;[^}]*gap: 12px;/);
    expect(css).toMatch(/\n\.accueillir,\n\.refuser \{[^}]*min-width: 0;[^}]*min-height: 44px;/);
  });
});
