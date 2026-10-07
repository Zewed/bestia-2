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
type Recit = { id: number; titre: string; texte: string; survenuLe: Date; luLe: Date | null };
const recits = vi.hoisted(() => ({ recitsDuTerritoire: vi.fn(async (): Promise<Recit[]> => []), marquerUnRecitLu: vi.fn() }));
vi.mock("@/monde/recits", () => recits);
vi.mock("@/temps/rattraper", () => ({ rattraper: vi.fn(async () => new Date()) }));
vi.mock("@/db", () => ({ getPool: () => ({}) }));
vi.mock("next/server", async (original) => ({ ...(await original<object>()), connection: async () => {} }));

import Recits, { metadata } from "./page";

/** Trois Récits, du plus récent au plus ancien comme la lecture les rend ; le deuxième déjà lu. */
const TROIS_RECITS: Recit[] = [
  { id: 43, titre: "Famine", texte: "Deux Habitants sont partis.", survenuLe: new Date("2026-10-07T12:05:00Z"), luLe: null },
  { id: 41, titre: "Retour de Récolte", texte: "Du Bois.", survenuLe: new Date("2026-10-06T22:30:00Z"), luLe: new Date("2026-10-07T08:00:00Z") },
  { id: 42, titre: "Incursion", texte: "Des loups, repoussés.", survenuLe: new Date("2026-03-01T09:00:00Z"), luLe: null },
];

describe("page Récits (US-0324)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    session.compteDeLaSession.mockReset();
    cookie.jetonDeSession.mockReset();
    recits.recitsDuTerritoire.mockReset();
  });

  const connecte = (lesRecits: Recit[] = TROIS_RECITS) => {
    cookie.jetonDeSession.mockResolvedValue("jeton-de-session");
    session.compteDeLaSession.mockResolvedValue({ id: 7, email: "nom@exemple.fr" });
    recits.recitsDuTerritoire.mockResolvedValue(lesRecits);
  };
  /** Le texte de chaque ligne de Récit, ses morceaux séparés par « · ». */
  const lignes = (html: string) =>
    [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, ligne]) => ligne.replace(/<[^>]+>/g, "|").split("|").filter(Boolean).join(" · "));

  it("titre la page « Récits », dans l'onglet comme sur la page", async () => {
    connecte();
    expect(metadata.title).toBe("Récits");
    expect(renderToStaticMarkup(await Recits())).toMatch(/<main[^>]*><h1[^>]*>Récits<\/h1>/);
  });

  it("sans aucun Récit, dit « Rien à raconter pour l'instant. », dans un bloc Bento, sans liste", async () => {
    connecte([]);
    const html = renderToStaticMarkup(await Recits());
    expect(html).toMatch(/<section[^>]*><p[^>]*>Rien à raconter pour l(&#x27;|')instant\.<\/p><\/section>/);
    expect(html).not.toContain("<ul");
  });

  it("liste les Récits du Territoire du joueur dans l'ordre de la lecture, chacun avec son titre, sa date et son heure", async () => {
    connecte();
    const html = renderToStaticMarkup(await Recits());
    expect(recits.recitsDuTerritoire).toHaveBeenCalledWith(expect.anything(), 12);
    expect(lignes(html)).toEqual([
      "Famine · nouveau · 7 octobre 2026 à 14:05 · Deux Habitants sont partis.",
      "Retour de Récolte · 7 octobre 2026 à 00:30 · Du Bois.",
      "Incursion · nouveau · 1 mars 2026 à 10:00 · Des loups, repoussés.",
    ]);
    // L'instant exact, lisible par la machine, à côté de la date écrite pour le joueur.
    expect(html).toMatch(/<time[^>]* datetime="2026-10-07T12:05:00.000Z"[^>]*>7 octobre 2026 à 14:05<\/time>/i);
  });

  it("marque les Récits non lus, et eux seuls, d'un mot et pas de la couleur seule", async () => {
    connecte();
    const html = renderToStaticMarkup(await Recits());
    const marques = [...html.matchAll(/<li([^>]*)>.*?<\/li>/g)].map(([ligne, attributs]) => [/data-non-lu/.test(attributs), ligne.includes(">nouveau<")]);
    expect(marques).toEqual([
      [true, true],
      [false, false],
      [true, true],
    ]);
  });

  it("garde le texte de chaque Récit replié, à déplier d'un toucher sur sa ligne", async () => {
    connecte();
    const html = renderToStaticMarkup(await Recits());
    const lignesRepliees = [...html.matchAll(/<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*>.*?<\/button><p id="([^"]+)"[^>]*hidden=""/g)];
    expect(lignesRepliees).toHaveLength(3);
    for (const [, controle, id] of lignesRepliees) expect(controle).toBe(id);
  });

  it("n'ajoute aucune phrase d'explication : le titre, puis les Récits", async () => {
    connecte([TROIS_RECITS[1]]);
    const html = renderToStaticMarkup(await Recits());
    expect(html.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual(["Récits", "Retour de Récolte", "7 octobre 2026 à 00:30", "Du Bois."]);
  });

  it("montre d'abord le récit d'arrivée s'il ne l'a pas été (US-0160)", async () => {
    connecte();
    chefs.chefDuCompte.mockResolvedValueOnce({ nom: "Ourse", territoireId: 12, recitLu: false });
    await expect(Recits()).rejects.toMatchObject({ digest: expect.stringContaining(";/jeu/arrivee;") });
  });

  it("renvoie vers la connexion sans session, qui ramènera ensuite ici", async () => {
    cookie.jetonDeSession.mockResolvedValue(undefined);
    await expect(Recits()).rejects.toMatchObject({ digest: expect.stringContaining(";/connexion?suite=%2Fjeu%2Frecits;") });
    expect(recits.recitsDuTerritoire).not.toHaveBeenCalled();
  });

  it("reste introuvable en production tant que l'entrée du jeu est fermée", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Recits()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(cookie.jetonDeSession).not.toHaveBeenCalled();
  });
});
