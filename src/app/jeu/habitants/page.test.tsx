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
}));
vi.mock("@/monde/habitants", () => habitants);
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Habitants, { metadata } from "./page";

describe("page Habitants (US-0302, US-0303, US-0305)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    habitants.habitantsDuTerritoire.mockReset();
    habitants.placesDuTerritoire.mockReset();
  });

  /** Un joueur connecté, ses `nombre` Habitants, et la place de son Territoire : 5 par défaut, celle du Foyer. */
  const connecte = (nombre = 3, places = 5) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    habitants.habitantsDuTerritoire.mockResolvedValue(Array.from({ length: nombre }, (_, i) => ({ id: 40 + i, prenom: PRENOMS[i % 3], ...UN_HABITANT })));
    habitants.placesDuTerritoire.mockResolvedValue(places);
  };
  /** Le texte de chaque ligne d'Habitant, ses morceaux séparés par « · ». */
  const lignes = (html: string) =>
    [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));

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
});
