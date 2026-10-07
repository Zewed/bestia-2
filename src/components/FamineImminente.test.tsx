// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FamineImminente } from "./FamineImminente";

const HEURE = 3_600_000;
/** Une espace insécable entre un nombre et son unité. */
const _ = " ";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** L'avertissement, s'il est là. */
const avertissement = () => document.querySelector<HTMLAnchorElement>("[data-alerte-famine]");
/** Ce qu'il dit, morceau par morceau. */
const morceaux = () => [...(avertissement()?.children ?? [])].map((morceau) => morceau.textContent);

describe("l'avertissement « famine imminente » (US-0321)", () => {
  it("paraît quand la Nourriture ne couvre plus que 12 heures d'Entretien : « Famine imminente », le temps qui reste, et « Voir »", () => {
    render(<FamineImminente heures={7.5} />);
    expect(morceaux()).toEqual(["Famine imminente", `Nourriture pour encore 7${_}h`, "Voir"]);
  });

  it("mène à la page Habitants, toute la bande étant le lien", () => {
    render(<FamineImminente heures={7.5} />);
    const lien = screen.getByRole("link", { name: `Famine imminente Nourriture pour encore 7${_}h Voir` });
    expect(lien.getAttribute("href")).toBe("/jeu/habitants");
    expect(lien).toBe(avertissement());
  });

  it("paraît à 12 heures tout juste, mais pas au-dessus", () => {
    render(<FamineImminente heures={12} />);
    expect(morceaux()[1]).toBe(`Nourriture pour encore 12${_}h`);
    cleanup();
    render(<FamineImminente heures={12.5} />);
    expect(avertissement()).toBeNull();
    expect(document.body.textContent).toBe("");
  });

  it("dit « moins d'une heure » quand la Nourriture est presque épuisée, et s'y tient à zéro", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={0.5} />);
    expect(morceaux()[1]).toBe("Nourriture pour encore moins d'une heure");
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(morceaux()[1]).toBe("Nourriture pour encore moins d'une heure");
  });

  it("fait baisser le temps qui reste en direct, au rythme du jeu", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={7.5} />);
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(morceaux()[1]).toBe(`Nourriture pour encore 6${_}h`);
    cleanup();
    render(<FamineImminente heures={7.5} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(HEURE / 100));
    expect(morceaux()[1]).toBe(`Nourriture pour encore 6${_}h`);
  });

  it("paraît page ouverte, quand la Nourriture passe sous le seuil", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={13} />);
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(HEURE - 1_000));
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(morceaux()).toEqual(["Famine imminente", `Nourriture pour encore 12${_}h`, "Voir"]);
  });

  it("paraît exactement au moment prévu en vitesse accélérée, entre deux battements de la seconde", async () => {
    vi.useFakeTimers();
    // 12 h 00 min 36 s de Nourriture, au temps ×100 : sous le seuil au bout de 360 ms réelles.
    render(<FamineImminente heures={12.01} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(359));
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1));
    expect(avertissement()).not.toBeNull();
  });
});
