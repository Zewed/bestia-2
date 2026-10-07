// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VOYAGEUR_ALERTE_MINUTES, VOYAGEUR_ATTEND_HEURES } from "@/reglages";
import { AuxPortes, type VoyageurAffiche } from "./AuxPortes";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
/** L'heure du jeu à l'affichage. */
const MAINTENANT = new Date("2026-10-07T18:00:00Z");
/** Un Voyageur arrivé il y a `ms` millisecondes de jeu, qui repart VOYAGEUR_ATTEND_HEURES heures après son arrivée. */
const voyageur = (id: number, prenom: string, ms: number): VoyageurAffiche => {
  const arriveLe = new Date(MAINTENANT.getTime() - ms);
  return { id, prenom, arriveLe, departLe: new Date(arriveLe.getTime() + VOYAGEUR_ATTEND_HEURES * HEURE) };
};
/** Un Voyageur à qui il reste `ms` millisecondes de jeu avant son départ. */
const partantDans = (id: number, prenom: string, ms: number) => voyageur(id, prenom, VOYAGEUR_ATTEND_HEURES * HEURE - ms);

const partie = () => screen.getByRole("heading", { name: "Aux portes" }).closest("section")!;
/** Les morceaux de chaque ligne, le prénom, depuis quand, puis le compte à rebours. */
const morceaux = () => within(partie()).queryAllByRole("listitem").map((li) => [...li.children]);
/** Le texte de chaque ligne, ses morceaux séparés par « · ». */
const lignes = () => morceaux().map((m) => m.map((e) => e.textContent).join(" · "));
/** Le compte à rebours de chaque ligne. */
const comptes = () => morceaux().map((m) => m[2].textContent);
/** Les comptes à rebours dans la couleur d'alerte. */
const enAlerte = () => morceaux().map((m) => m[2].hasAttribute("data-alerte"));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("les Voyageurs aux portes (US-0332)", () => {
  /** Le prénom et depuis quand, sans le compte à rebours (US-0333). */
  const debuts = () => lignes().map((l) => l.split(" · ").slice(0, 2).join(" · "));

  it("forment une partie « Aux portes », titrée comme les autres blocs", () => {
    render(<AuxPortes voyageurs={[]} maintenant={MAINTENANT} />);
    expect(within(partie()).getByRole("heading", { level: 2 }).textContent).toBe("Aux portes");
  });

  it("y sont chacun sur une ligne, dans l'ordre de la lecture, du premier arrivé au dernier : son prénom, et depuis quand il attend", () => {
    render(<AuxPortes voyageurs={[voyageur(3, "Arno", 5 * HEURE), voyageur(1, "Brune", 2 * HEURE + 20 * MINUTE), voyageur(2, "Cael", 12 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(debuts()).toEqual(["Arno · arrivé il y a 5 h", "Brune · arrivé il y a 2 h", "Cael · arrivé il y a 12 min"]);
  });

  it.each([
    [30_000, "arrivé à l'instant"],
    [MINUTE, "arrivé il y a 1 min"],
    [59 * MINUTE + 59_000, "arrivé il y a 59 min"],
    [HEURE, "arrivé il y a 1 h"],
    [11 * HEURE + 59 * MINUTE, "arrivé il y a 11 h"],
  ])("disent depuis quand ils attendent, en heures du jeu : %i ms, « %s »", (ms, depuis) => {
    render(<AuxPortes voyageurs={[voyageur(1, "Arno", ms)]} maintenant={MAINTENANT} />);
    expect(debuts()).toEqual([`Arno · ${depuis}`]);
  });

  it("laissent, quand personne n'attend, « Personne aux portes pour l'instant. », sans liste vide", () => {
    render(<AuxPortes voyageurs={[]} maintenant={MAINTENANT} />);
    expect([...partie().children].map((e) => [e.tagName, e.textContent])).toEqual([
      ["H2", "Aux portes"],
      ["P", "Personne aux portes pour l'instant."],
    ]);
  });

  it("n'offrent encore aucun bouton : accueillir et refuser viendront ensuite", () => {
    render(<AuxPortes voyageurs={[voyageur(1, "Arno", HEURE)]} maintenant={MAINTENANT} />);
    expect(within(partie()).queryAllByRole("button")).toEqual([]);
    expect(within(partie()).queryAllByRole("link")).toEqual([]);
  });
});

describe("le compte à rebours d'un Voyageur (US-0333)", () => {
  it("dit, au bout de sa ligne, dans combien de temps il repart, à la minute supérieure", () => {
    render(<AuxPortes voyageurs={[voyageur(1, "Joran", 18 * MINUTE), voyageur(2, "Ilda", 5 * HEURE), partantDans(3, "Maëlle", 42 * MINUTE + 10_000)]} maintenant={MAINTENANT} />);
    expect(lignes()).toEqual(["Joran · arrivé il y a 18 min · repart dans 11 h 42", "Ilda · arrivé il y a 5 h · repart dans 7 h", "Maëlle · arrivé il y a 11 h · repart dans 43 min"]);
  });

  it("diminue en direct, sans recharger la page, au rythme du jeu", async () => {
    vi.useFakeTimers();
    render(<AuxPortes voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 11 h 42"]);
    await act(async () => vi.advanceTimersByTime(59_000));
    expect(comptes()).toEqual(["repart dans 11 h 42"]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(lignes()).toEqual(["Joran · arrivé il y a 19 min · repart dans 11 h 41"]);
  });

  it("va plus vite quand le temps du jeu est accéléré : à ×60, une minute de jeu par seconde", async () => {
    vi.useFakeTimers();
    render(<AuxPortes voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} vitesse={60} />);
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(comptes()).toEqual(["repart dans 11 h 39"]);
  });

  it(`passe dans la couleur d'alerte sous ${VOYAGEUR_ALERTE_MINUTES} minutes, et pas avant`, async () => {
    vi.useFakeTimers();
    render(<AuxPortes voyageurs={[partantDans(1, "Joran", 3 * HEURE), partantDans(2, "Ilda", 60 * MINUTE + 30_000), partantDans(3, "Maëlle", 59 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 3 h", "repart dans 1 h 01", "repart dans 59 min"]);
    expect(enAlerte()).toEqual([false, false, true]);
    // Une minute plus tard, Ilda passe sous l'heure : l'alerte vient avec « 59 min », pas plus tôt.
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 2 h 59", "repart dans 1 h", "repart dans 58 min"]);
    expect(enAlerte()).toEqual([false, false, true]);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 2 h 58", "repart dans 59 min", "repart dans 57 min"]);
    expect(enAlerte()).toEqual([false, true, true]);
  });

  it("affiche « sur le départ », toujours en alerte, quand le compte arrive à zéro, et jamais de temps négatif", async () => {
    vi.useFakeTimers();
    render(<AuxPortes voyageurs={[partantDans(1, "Joran", 90_000), partantDans(2, "Ilda", 0), partantDans(3, "Maëlle", -2 * HEURE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 2 min", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(comptes()).toEqual(["repart dans 1 min", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(comptes()).toEqual(["sur le départ", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(comptes()).toEqual(["sur le départ", "sur le départ", "sur le départ"]);
    expect(enAlerte()).toEqual([true, true, true]);
  });

  it("repart de la nouvelle heure du jeu quand la page est relue, sans compter deux fois le temps passé", async () => {
    vi.useFakeTimers();
    const joran = voyageur(1, "Joran", 18 * MINUTE);
    const { rerender } = render(<AuxPortes voyageurs={[joran]} maintenant={MAINTENANT} />);
    await act(async () => vi.advanceTimersByTime(5 * MINUTE));
    expect(comptes()).toEqual(["repart dans 11 h 37"]);
    // La barre recale la page (US-0213) : le serveur donne la nouvelle heure du jeu, cinq minutes plus tard.
    rerender(<AuxPortes voyageurs={[joran]} maintenant={new Date(MAINTENANT.getTime() + 5 * MINUTE)} />);
    expect(comptes()).toEqual(["repart dans 11 h 37"]);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 11 h 36"]);
  });

  it("ne se fait pas réannoncer à chaque minute par un lecteur d'écran : aucune zone annoncée", async () => {
    vi.useFakeTimers();
    render(<AuxPortes voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} />);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(partie().querySelectorAll("[aria-live], [role=status], [role=timer], [role=alert], [role=log], [role=marquee]")).toHaveLength(0);
  });
});
