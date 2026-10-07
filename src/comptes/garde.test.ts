import { describe, expect, it, vi } from "vitest";

const cookie = vi.hoisted(() => ({ jetonDeSession: vi.fn() }));
vi.mock("./cookie-session", () => cookie);
const sessions = vi.hoisted(() => ({ compteDeLaSession: vi.fn() }));
vi.mock("./session", () => sessions);
const chefs = vi.hoisted(() => ({ chefDuCompte: vi.fn(), naitreSurLaCouronne: vi.fn(async (): Promise<number | null> => null) }));
vi.mock("@/chefs/chef", () => chefs);
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const temps = vi.hoisted(() => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/temps/rattraper", () => temps);
const stocks = vi.hoisted(() => ({ stocksDuTerritoire: vi.fn(async () => [{ id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "8.000000" }]) }));
vi.mock("@/monde/stocks", () => stocks);
const habitants = vi.hoisted(() => ({
  nombreDHabitants: vi.fn(async () => 3),
  nombreSansMetier: vi.fn(async () => 0),
  entretienDesHabitants: vi.fn(async () => ({ habitants: 3, parHabitant: 2, parHeure: "6.000000" })),
}));
vi.mock("@/monde/habitants", () => habitants);
const recits = vi.hoisted(() => ({ nombreDeRecitsNonLus: vi.fn(async () => 0) }));
vi.mock("@/monde/recits", () => recits);
const voyageurs = vi.hoisted(() => ({ nombreDeVoyageurs: vi.fn(async () => 0) }));
vi.mock("@/monde/voyageurs", () => voyageurs);

import { entretienALHeure, exigerCompte, exigerCompteSansChef, habitantsALHeure, joueurConnecte, recitsNonLusALHeure, sansMetierALHeure, stocksALHeure, voyageursALHeure } from "./garde";

describe("garde du jeu", () => {
  const connecte = (chef: { nom: string; territoireId?: number | null; recitLu?: boolean } | null) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    sessions.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    chefs.chefDuCompte.mockResolvedValue(chef);
  };

  it("rend le compte connecté qui a son nom de chef", async () => {
    connecte({ nom: "Ourse", territoireId: null, recitLu: false });
    expect(await exigerCompte("/jeu/territoire")).toEqual({ id: 7, email: "nom@exemple.fr", nomDeChef: "Ourse", territoireId: null, recitLu: false });
    expect(chefs.chefDuCompte).toHaveBeenCalledWith(expect.anything(), 7);
  });

  it("envoie un joueur sans nom de chef le choisir, quelle que soit la page demandée (US-0131)", async () => {
    connecte(null);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/nom-de-chef;") });
    await expect(exigerCompte()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/nom-de-chef;") });
  });

  it("ouvre l'écran du nom de chef à un joueur sans nom, et seulement à lui", async () => {
    connecte(null);
    expect(await exigerCompteSansChef()).toEqual({ id: 7, email: "nom@exemple.fr" });
    connecte({ nom: "Ourse" });
    await expect(exigerCompteSansChef()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/jeu;/) });
  });

  it("envoie un visiteur vers la connexion, avec la page où revenir ensuite", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({
      digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fterritoire;"),
    });
    await expect(exigerCompte()).rejects.toMatchObject({ digest: expect.stringMatching(/;\/connexion;/) });
  });

  it("arrête net une session expirée, et le fait dire à la connexion (US-0125)", async () => {
    cookie.jetonDeSession.mockResolvedValue("jeton-perime");
    sessions.compteDeLaSession.mockResolvedValue(null);
    await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({
      digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Fterritoire&expiree=1;"),
    });
  });

  it("lit le joueur connecté sans jamais rediriger, pour la barre du haut (US-0140)", async () => {
    connecte({ nom: "Ourse", territoireId: 12, recitLu: true });
    expect(await joueurConnecte()).toEqual({ compte: { id: 7, email: "nom@exemple.fr" }, nomDeChef: "Ourse", territoireId: 12, recitLu: true });
    connecte(null);
    expect(await joueurConnecte()).toEqual({ compte: { id: 7, email: "nom@exemple.fr" }, nomDeChef: null, territoireId: null, recitLu: false });
    cookie.jetonDeSession.mockResolvedValue(undefined);
    expect(await joueurConnecte()).toBeNull();
  });

  it("met le Territoire du joueur à l'heure avant de rendre la main à la page (US-0156)", async () => {
    temps.rattraper.mockClear();
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    sessions.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    chefs.chefDuCompte.mockResolvedValue({ nom: "Ourse", territoireId: 12, recitLu: true });
    expect(await exigerCompte("/jeu")).toMatchObject({ nomDeChef: "Ourse", territoireId: 12 });
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 12);
  });

  it("lit les Stocks de la barre du haut après avoir mis le Territoire à l'heure (US-0203)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    stocks.stocksDuTerritoire.mockImplementationOnce(async () => (ordre.push("lecture"), []));
    await stocksALHeure(12);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 12);
    expect(ordre).toEqual(["rattrapage", "lecture"]);
  });

  it("compte les Habitants de la barre du haut après avoir mis le Territoire à l'heure (US-0304)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    habitants.nombreDHabitants.mockImplementationOnce(async () => (ordre.push("comptage"), 4));
    expect(await habitantsALHeure(13)).toBe(4);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 13);
    expect(habitants.nombreDHabitants).toHaveBeenCalledWith(expect.anything(), 13);
    expect(ordre).toEqual(["rattrapage", "comptage"]);
  });

  it("compte les Récits non lus de la navigation après avoir mis le Territoire à l'heure (US-0324)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    recits.nombreDeRecitsNonLus.mockImplementationOnce(async () => (ordre.push("comptage"), 2));
    expect(await recitsNonLusALHeure(14)).toBe(2);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 14);
    expect(recits.nombreDeRecitsNonLus).toHaveBeenCalledWith(expect.anything(), 14);
    expect(ordre).toEqual(["rattrapage", "comptage"]);
  });

  it("compte les Voyageurs aux portes pour la navigation après avoir mis le Territoire à l'heure (US-0332)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    voyageurs.nombreDeVoyageurs.mockImplementationOnce(async () => (ordre.push("comptage"), 2));
    expect(await voyageursALHeure(15)).toBe(2);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 15);
    expect(voyageurs.nombreDeVoyageurs).toHaveBeenCalledWith(expect.anything(), 15);
    expect(ordre).toEqual(["rattrapage", "comptage"]);
  });

  it("compte les Habitants sans Métier pour la navigation après avoir mis le Territoire à l'heure (US-0313)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    habitants.nombreSansMetier.mockImplementationOnce(async () => (ordre.push("comptage"), 2));
    expect(await sansMetierALHeure(16)).toBe(2);
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 16);
    expect(habitants.nombreSansMetier).toHaveBeenCalledWith(expect.anything(), 16);
    expect(ordre).toEqual(["rattrapage", "comptage"]);
  });

  it("lit l'Entretien des Habitants pour l'avertissement de famine après avoir mis le Territoire à l'heure (US-0321)", async () => {
    temps.rattraper.mockClear();
    const ordre: string[] = [];
    temps.rattraper.mockImplementationOnce(async () => (ordre.push("rattrapage"), new Date()));
    habitants.entretienDesHabitants.mockImplementationOnce(async () => (ordre.push("lecture"), { habitants: 12, parHabitant: 2, parHeure: "24.000000" }));
    expect(await entretienALHeure(17)).toBe("24.000000");
    expect(temps.rattraper).toHaveBeenCalledWith("territoire", 17);
    expect(habitants.entretienDesHabitants).toHaveBeenCalledWith(expect.anything(), 17);
    expect(ordre).toEqual(["rattrapage", "lecture"]);
  });

  describe("reprendre l'arrivée là où elle s'était arrêtée (US-0160)", () => {
    it("montre d'abord le récit d'arrivée tant qu'il ne l'a pas été, quelle que soit la page", async () => {
      connecte({ nom: "Ourse", territoireId: 12, recitLu: false });
      await expect(exigerCompte("/jeu")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
      await expect(exigerCompte("/jeu/territoire")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
    });

    it("laisse la page du récit s'afficher, et les autres une fois le récit montré", async () => {
      connecte({ nom: "Ourse", territoireId: 12, recitLu: false });
      expect(await exigerCompte("/jeu/arrivee")).toMatchObject({ territoireId: 12 });
      connecte({ nom: "Ourse", territoireId: 12, recitLu: true });
      expect(await exigerCompte("/jeu")).toMatchObject({ territoireId: 12 });
    });

    it("donne un Foyer à un chef qui n'en a pas, puis lui montre le récit", async () => {
      temps.rattraper.mockClear();
      chefs.naitreSurLaCouronne.mockResolvedValueOnce(21);
      connecte({ nom: "Ourse", territoireId: null, recitLu: false });
      await expect(exigerCompte("/jeu")).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
      expect(chefs.naitreSurLaCouronne).toHaveBeenCalledWith(expect.anything(), 7);
      expect(temps.rattraper).toHaveBeenCalledWith("territoire", 21);
    });

    it("laisse passer un chef toujours sans Foyer quand le Monde est complet", async () => {
      chefs.naitreSurLaCouronne.mockResolvedValueOnce(null);
      connecte({ nom: "Ourse", territoireId: null, recitLu: false });
      expect(await exigerCompte("/jeu")).toMatchObject({ territoireId: null });
    });
  });
});

