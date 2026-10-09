import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lireRaretesParAnneau } from "@/donnees/jeux";
import { SIMULATION_DES_RARETES_JOURS } from "@/reglages";
import type { SimulationDesRaretes } from "./simulation";

const entetes = vi.hoisted(() => ({ authorization: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(entetes.authorization ? { authorization: entetes.authorization } : {}),
}));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
const simulation = vi.hoisted(() => ({ simulerLesRaretes: vi.fn() }));
vi.mock("./simulation", async (original) => {
  const vraie = await original<typeof import("./simulation")>();
  // La vraie simulation, faite une seule fois par graine et par période pour tous les essais : tout un Monde, un mois.
  const faites = new Map<string, ReturnType<typeof vraie.simulerLesRaretes>>();
  simulation.simulerLesRaretes.mockImplementation((options: Parameters<typeof vraie.simulerLesRaretes>[0]) => {
    const cle = `${options.graine} ${options.de.toISOString()}`;
    if (!faites.has(cle)) faites.set(cle, vraie.simulerLesRaretes(options));
    return faites.get(cle);
  });
  return simulation;
});

import { proxy } from "@/proxy";
import Raretes from "./page";

const MOT_DE_PASSE = "mot-de-passe-d-essai";
/** L'heure du jeu pendant les essais : la simulation part du début de ce jour-là. */
const AUJOURD_HUI = new Date("2026-10-09T15:42:00Z");
const MINUIT = new Date("2026-10-09T00:00:00Z");
const ouvrir = (recherche: Record<string, string> = {}) => Raretes({ params: Promise.resolve({}), searchParams: Promise.resolve(recherche) } as PageProps<"/controle/raretes">);
/** La page en HTML, ses espaces fines (« 2 070 ») rendues en espaces simples. */
const afficher = async (recherche: Record<string, string> = {}) => renderToStaticMarkup(await ouvrir(recherche)).replaceAll(" ", " ");
const connecte = () => {
  entetes.authorization = `Basic ${Buffer.from(`dev:${MOT_DE_PASSE}`).toString("base64")}`;
};
const nombre = (n: number) => n.toLocaleString("fr-FR").replaceAll(" ", " ");
const deuxDecimales = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

describe("page de simulation des Raretés par Anneau (US-0931)", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLE_MOT_DE_PASSE", MOT_DE_PASSE);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(AUJOURD_HUI);
    simulation.simulerLesRaretes.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    entetes.authorization = null;
  });

  it("est inaccessible aux joueurs : le navigateur demande le mot de passe, et la page répond « introuvable » sans lui", async () => {
    const reponse = await proxy(new NextRequest("https://bestia.test/controle/raretes?graine=12345"));
    expect(reponse?.status).toBe(401);
    await expect(ouvrir({ graine: "12345" })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("propose une graine à simuler, et ne simule rien sans elle", async () => {
    connecte();
    const html = await afficher();
    expect(html).toContain("<h1");
    expect(html).toMatch(/<input(?=[^>]*name="graine")[^>]*aria-label="Graine"/);
    expect(html).toMatch(/<button type="submit"[^>]*>Simuler<\/button>/);
    expect(html).toMatch(/<a [^>]*href="\/controle"[^>]*>Contrôle<\/a>/);
    expect(html).not.toContain("<table");
    expect(simulation.simulerLesRaretes).not.toHaveBeenCalled();
  });

  describe("une graine simulée", () => {
    it(`simule ${SIMULATION_DES_RARETES_JOURS} jours de jeu à partir du début du jour, et donne le résultat du contrôle en tête`, async () => {
      connecte();
      const html = await afficher({ graine: "12345" });
      expect(simulation.simulerLesRaretes).toHaveBeenCalledWith({ graine: 12345, de: MINUIT });
      expect(html).toContain(`Graine 12345 · ${SIMULATION_DES_RARETES_JOURS} jours de jeu`);
      expect(html).toContain("Contrôle réussi");
      expect(html).not.toContain("Contrôle échoué");
      // Le résultat avant le premier Anneau.
      expect(html.indexOf("Contrôle réussi")).toBeLessThan(html.indexOf("Anneau 1"));
      expect(html).toContain("Tolérance : 1 point");
      expect(html).toContain("Rythme visé : première peu commune en 3 à 4 jours, rare en un mois.");
    });

    it("affiche un tableau par Anneau : la part obtenue de chaque Rareté à côté de la part attendue, et ses apparitions par Case et par jour", async () => {
      connecte();
      const html = await afficher({ graine: "12345" });
      const { anneaux } = simulation.simulerLesRaretes.mock.results[0].value as SimulationDesRaretes;
      expect(html.match(/<table/g)).toHaveLength(anneaux.length);
      expect(html).toMatch(/<h2[^>]*>Anneau 1 · Couronne<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>Anneau 3<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>Anneau 6 · Cœur sauvage<\/h2>/);
      expect(html).toMatch(/<th[^>]*>Rareté<\/th><th[^>]*>Obtenue<\/th><th[^>]*>Attendue<\/th>/);
      for (const a of anneaux) {
        const tableau = html.slice(html.indexOf(`>Anneau ${a.anneau}`), html.indexOf("</table>", html.indexOf(`>Anneau ${a.anneau}`)));
        expect(tableau).toContain(`${nombre(a.cases)} Cases · ${nombre(a.apparitions)} apparitions · ${deuxDecimales(a.parCaseParJour)} par Case et par jour`);
        for (const r of a.raretes) {
          expect(tableau).toMatch(new RegExp(`data-rarete="${r.rareteId}">[^<]+</span></td><td>${deuxDecimales(r.obtenue)} %</td><td>${r.attendue.toLocaleString("fr-FR")} %</td>`));
        }
      }
      // Les noms des Raretés, de la commune à la légendaire.
      expect(html).toContain('data-rarete="peu_commune">Peu commune</span>');
      expect(html).not.toContain('data-rarete="mythique"');
    });

    it("dit pourquoi le contrôle échoue : un écart hors de la tolérance, des communes non majoritaires, marqués dans leur tableau", async () => {
      connecte();
      const chances = lireRaretesParAnneau();
      const ligne = (anneau: number, obtenues: number[], horsTolerance: boolean[] = []) =>
        chances[anneau - 1].map(({ rareteId, pourcent }, i) => ({ rareteId, obtenue: obtenues[i] ?? pourcent, attendue: pourcent, horsTolerance: horsTolerance[i] ?? false }));
      const anneaux = chances.map((_, i) => ({
        anneau: i + 1,
        cases: 100,
        apparitions: 3000,
        parCaseParJour: 1,
        raretes: ligne(i + 1, []),
        communesMajoritaires: true,
      }));
      anneaux[1] = { ...anneaux[1], raretes: ligne(2, [74.5, 18.5], [true, true]) };
      anneaux[5] = { ...anneaux[5], raretes: ligne(6, [49.6]), communesMajoritaires: false };
      simulation.simulerLesRaretes.mockReturnValueOnce({ jours: 30, tolerance: 1, anneaux, reussie: false } satisfies SimulationDesRaretes);
      const html = await afficher({ graine: "7" });
      expect(html).toContain("Contrôle échoué");
      expect(html).not.toContain("Contrôle réussi");
      expect(html).toContain("<li>Anneau 2 · Commune : 74,50 % au lieu de 76 %</li>");
      expect(html).toContain("<li>Anneau 2 · Peu commune : 18,50 % au lieu de 17 %</li>");
      expect(html).toContain("<li>Anneau 6 · Communes non majoritaires : 49,60 %</li>");
      // Dans les tableaux, les parts en cause en couleur d'échec, et elles seules.
      expect(html.match(/<td class="[^"]*echec[^"]*">/g)).toHaveLength(3);
      expect(html).toMatch(/<td class="[^"]*echec[^"]*">74,50 %<\/td>/);
      expect(html).toMatch(/<td class="[^"]*echec[^"]*">49,60 %<\/td>/);
    });

    it("refuse une graine qui n'en est pas une, en le disant sous le champ", async () => {
      connecte();
      const html = await afficher({ graine: "abc" });
      expect(html).toContain("Une graine est un nombre entier de 0 à 4294967295, pas « abc ».");
      expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
      expect(html).not.toContain("<table");
      expect(simulation.simulerLesRaretes).not.toHaveBeenCalled();
    });
  });
});
