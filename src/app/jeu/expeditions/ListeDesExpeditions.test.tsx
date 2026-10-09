// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";
import { ListeDesExpeditions } from "./ListeDesExpeditions";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const MINUTE_MS = 60_000;
/** L'heure du jeu à l'affichage de la page : 9 h 42 à Paris, pas à la minute pile. */
const MAINTENANT = new Date("2026-10-09T07:42:13.250Z");
/** Une heure du jeu, `minutes` avant l'affichage. */
const avant = (minutes: number) => new Date(MAINTENANT.getTime() - minutes * MINUTE_MS);

/** Une Expédition vers une forêt à 3 Cases, 1 h d'aller et de retour, 4 h de séjour, partie à `partLe`. */
const vers = (id: number, partLe: Date, autre: Partial<ExpeditionEnCours> = {}): ExpeditionEnCours => ({
  id,
  destination: { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 3, anneau: 3 },
  phase: "aller",
  partLe,
  trajetMinutes: 60,
  sejourMinutes: 240,
  explorateurs: ["Joran"],
  escorte: [],
  ...autre,
});

/** Chaque Expédition de la liste : sa phase et son temps restant. */
const comptes = () => [...document.querySelectorAll("li [data-ligne]")].map((l) => [...l.children].slice(2, 4).map((m) => m.textContent));

describe("la liste des Expéditions en cours, en direct (US-0918)", () => {
  it("montre chaque Expédition, dans l'ordre de la lecture, chacune avec son temps restant", () => {
    render(<ListeDesExpeditions expeditions={[vers(5, avant(18)), vers(6, avant(90), { destination: { q: 4, r: -5, inconnue: true, distance: 1 } })]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual([
      ["Aller", "arrive dans 42 min"],
      ["Séjour", "repart dans 3 h 30"],
    ]);
    expect([...document.querySelectorAll("li strong")].map((d) => d.textContent)).toEqual(["Forêt", "Case inconnue"]);
  });

  it("fait avancer les comptes à rebours sans recharger la page, et change la phase à son heure", async () => {
    vi.useFakeTimers();
    // Partie il y a 59 min : elle arrive dans 47 s, à la minute supérieure « 1 min ».
    render(<ListeDesExpeditions expeditions={[vers(5, new Date(avant(59).getTime() - 13_250)), vers(6, avant(18))]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual([
      ["Aller", "arrive dans 1 min"],
      ["Aller", "arrive dans 42 min"],
    ]);
    await act(async () => vi.advanceTimersByTime(46_000));
    expect(comptes()[0]).toEqual(["Aller", "arrive dans 1 min"]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(comptes()).toEqual([
      ["Séjour", "repart dans 4 h"],
      ["Aller", "arrive dans 42 min"],
    ]);
    await act(async () => vi.advanceTimersByTime(MINUTE_MS));
    expect(comptes()[1]).toEqual(["Aller", "arrive dans 41 min"]);
  });

  it("suit le rythme du jeu, quand il est accéléré", async () => {
    vi.useFakeTimers();
    render(<ListeDesExpeditions expeditions={[vers(5, avant(18))]} maintenant={MAINTENANT} vitesse={60} />);
    // 3 s à × 60 : 3 minutes du jeu.
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(comptes()).toEqual([["Aller", "arrive dans 39 min"]]);
  });

  it("repart de la nouvelle heure du jeu quand la page est relue", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<ListeDesExpeditions expeditions={[vers(5, avant(18))]} maintenant={MAINTENANT} />);
    await act(async () => vi.advanceTimersByTime(2 * MINUTE_MS));
    expect(comptes()).toEqual([["Aller", "arrive dans 40 min"]]);
    // Relue 10 minutes du jeu plus tard : le temps déjà écoulé dans le navigateur ne compte plus.
    rerender(<ListeDesExpeditions expeditions={[vers(5, avant(18))]} maintenant={new Date(MAINTENANT.getTime() + 10 * MINUTE_MS)} />);
    expect(comptes()).toEqual([["Aller", "arrive dans 32 min"]]);
  });

  it("se déplie Expédition par Expédition sur un téléphone, et se replie de même", async () => {
    render(<ListeDesExpeditions expeditions={[vers(5, avant(18)), vers(6, avant(90))]} maintenant={MAINTENANT} />);
    const boutons = () => [...document.querySelectorAll("li button")];
    const etats = () => boutons().map((b) => b.getAttribute("aria-expanded"));
    expect(etats()).toEqual(["false", "false"]);
    await userEvent.click(boutons()[1]);
    expect(etats()).toEqual(["false", "true"]);
    await userEvent.click(boutons()[0]);
    expect(etats()).toEqual(["true", "true"]);
    await userEvent.click(boutons()[1]);
    expect(etats()).toEqual(["true", "false"]);
  });
});

describe("le séjour sur la Case, en direct (US-0915)", () => {
  it("passe en séjour à l'arrivée avec le compte à rebours de la durée choisie, puis repart seule vers le Foyer à sa fin", async () => {
    vi.useFakeTimers();
    // Partie il y a 59 min 30 s, au rythme du jeu × 60 : elle arrive dans 30 s du jeu ; son séjour dure 4 h.
    render(<ListeDesExpeditions expeditions={[vers(5, new Date(avant(59).getTime() - 30_000))]} maintenant={MAINTENANT} vitesse={60} />);
    expect(comptes()).toEqual([["Aller", "arrive dans 1 min"]]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(comptes()).toEqual([["Séjour", "repart dans 4 h"]]);
    // 3 h 59 du jeu plus tard, sans rien toucher ni recharger : la dernière minute du séjour.
    await act(async () => vi.advanceTimersByTime(239_000));
    expect(comptes()).toEqual([["Séjour", "repart dans 1 min"]]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(comptes()).toEqual([["Retour", "rentre dans 1 h"]]);
  });
});
