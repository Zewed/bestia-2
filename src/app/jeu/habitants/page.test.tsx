import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

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
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Habitants, { metadata } from "./page";

describe("page Habitants (US-0302, US-0303, US-0305, US-0306, US-0318)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    habitants.habitantsDuTerritoire.mockReset();
    habitants.placesDuTerritoire.mockReset();
    habitants.entretienDesHabitants.mockReset();
  });

  /**
   * Un joueur connecté, ses `nombre` Habitants, la place de son Territoire (5 par défaut, celle du Foyer)
   * et leur Entretien, 2 Nourriture par heure chacun.
   */
  const connecte = (nombre = 3, places = 5) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    habitants.habitantsDuTerritoire.mockResolvedValue(Array.from({ length: nombre }, (_, i) => ({ id: 40 + i, prenom: PRENOMS[i % 3], ...UN_HABITANT })));
    habitants.placesDuTerritoire.mockResolvedValue(places);
    habitants.entretienDesHabitants.mockResolvedValue({ habitants: nombre, parHabitant: 2, parHeure: String(2 * nombre) });
  };
  /** Le texte de chaque ligne d'Habitant, ses morceaux séparés par « · ». */
  const lignes = (html: string) =>
    [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));
  /** US-0318 : la ligne du bloc Entretien, telle qu'on la lit. */
  const ligneEntretien = (html: string) => html.match(/<h2[^>]*>Entretien<\/h2><p[^>]*>(.*?)<\/p><\/section>/)?.[1].replace(/<[^>]+>/g, "");

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

  it("montre chaque Habitant sur une ligne, sous leur nombre : son prénom, « sans Métier » et « libre » (US-0303)", async () => {
    connecte();
    const html = renderToStaticMarkup(await Habitants());
    expect(html).toMatch(/<p[^>]*>3 Habitants sur 5 places<\/p><\/div><ul[^>]*>(<li[^>]*>.*?<\/li>){3}<\/ul><\/section>/);
    expect(lignes(html)).toEqual(["Arno · sans Métier · libre", "Brune · sans Métier · libre", "Cael · sans Métier · libre"]);
  });

  it("montre le Métier d'un Habitant qui en a un, à la place de « sans Métier »", async () => {
    connecte();
    habitants.habitantsDuTerritoire.mockResolvedValue([
      { id: 41, prenom: "Dara", ...UN_HABITANT },
      { id: 40, prenom: "Elio", ...UN_HABITANT, metier: "Chasseur" },
    ]);
    expect(lignes(renderToStaticMarkup(await Habitants()))).toEqual(["Dara · sans Métier · libre", "Elio · Chasseur · libre"]);
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

  it("ne montre pas de liste vide quand il n'y a aucun Habitant", async () => {
    connecte(0);
    expect(renderToStaticMarkup(await Habitants())).not.toContain("<ul");
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
    expect(html.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual([
      "Habitants",
      "3 Habitants sur 5 places",
      ...PRENOMS.flatMap((prenom) => [prenom, "sans Métier", "libre"]),
      "Entretien",
      "3 Habitants × 2 Nourriture = ",
      "6 Nourriture par heure",
    ]);
    expect(html).not.toMatch(/<(a|button|form|input|select)[ >]/);
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
    expect(html).toMatch(/<section[^>]*><div[^>]*><p[^>]*>5 Habitants sur 5 places<\/p><p[^>]*>Plus de place<\/p><\/div><ul[^>]*>(<li[^>]*>.*?<\/li>){5}<\/ul><\/section>/);
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
    expect(html).toMatch(/<main[^>]*><h1[^>]*>Habitants<\/h1><div[^>]*><section[^>]*--largeur:8[^>]*>.*?<\/ul><\/section><section[^>]*--largeur:4[^>]*><h2[^>]*>Entretien<\/h2>/);
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
