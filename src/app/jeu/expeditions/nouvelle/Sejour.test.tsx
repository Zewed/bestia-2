// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SEJOUR_MINUTES } from "@/reglages";
import { formaterMinutes } from "@/temps/affichage";

/**
 * Next.js relie window.history.replaceState à useSearchParams ; la simulation fait de même : le composant relit
 * l'adresse à chaque changement, sans recharger la page.
 */
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const abonnes = new Set<() => void>();
  const remplacer = window.history.replaceState.bind(window.history);
  window.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
    remplacer(...args);
    abonnes.forEach((prevenir) => prevenir());
  };
  const suivre = (prevenir: () => void) => {
    abonnes.add(prevenir);
    return () => abonnes.delete(prevenir);
  };
  return { useSearchParams: () => new URLSearchParams(useSyncExternalStore(suivre, () => window.location.search)) };
});

import { Sejour } from "./Sejour";

const { min, max, pas } = SEJOUR_MINUTES;
/** L'adresse de l'écran d'Expédition devient `recherche` (« ?q=3&r=-5&sejour=240 ») : un lien, ou un autre bloc qui y écrit. */
const aller = (recherche = "") => act(() => window.history.replaceState(null, "", `/jeu/expeditions/nouvelle${recherche}`));
/** L'écran d'Expédition, ouvert à l'adresse `recherche` : un lien, ou un rechargement. */
const ouvrir = (recherche = "") => {
  window.history.replaceState(null, "", `/jeu/expeditions/nouvelle${recherche}`);
  return render(<Sejour />);
};
const curseur = () => screen.getByRole<HTMLInputElement>("slider", { name: "Durée du séjour" });
/** Bouge le curseur jusqu'à `minutes`, comme le doigt, la souris ou les flèches du clavier. */
const glisser = (minutes: number) => fireEvent.change(curseur(), { target: { value: String(minutes) } });
const prets = () => within(screen.getByRole("group", { name: "Durées toutes prêtes" })).getAllByRole("button");
/** Les durées toutes prêtes pressées, à leur texte. */
const presses = () => prets().filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
/** La durée choisie, telle qu'elle s'affiche en grand. */
const affichee = () => screen.getByRole("status").textContent;

describe("le séjour sur l'écran d'Expédition (US-0906)", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("est un bloc « Séjour » : la durée choisie, un curseur entre ses deux bornes, et les durées toutes prêtes", () => {
    const { container } = ouvrir();
    const bloc = screen.getByRole("heading", { level: 2, name: "Séjour" }).closest("section");
    expect(container.firstChild).toBe(bloc);
    expect(bloc?.textContent).toBe(["Séjour", "1 h", formaterMinutes(min), formaterMinutes(max), "1 h", "4 h", "8 h", "12 h"].join(""));
  });

  it("se choisit entre les bornes du réglage, par ses pas, au curseur du formulaire de départ", () => {
    ouvrir();
    expect([curseur().type, curseur().min, curseur().max, curseur().step, curseur().name]).toEqual(["range", String(min), String(max), String(pas), "sejour"]);
  });

  it("propose d'un doigt 1 h, 4 h, 8 h et 12 h, et s'ouvre sur la première", () => {
    ouvrir();
    expect(prets().map((b) => [b.textContent, b.getAttribute("type")])).toEqual([
      ["1 h", "button"],
      ["4 h", "button"],
      ["8 h", "button"],
      ["12 h", "button"],
    ]);
    expect([curseur().value, affichee(), presses()]).toEqual(["60", "1 h", ["1 h"]]);
  });

  it("toucher une durée toute prête la choisit : le curseur y va, la durée affichée suit, et l'adresse la garde aussitôt", async () => {
    ouvrir("?q=3&r=-5");
    await userEvent.click(screen.getByRole("button", { name: "8 h" }));
    expect([curseur().value, curseur().getAttribute("aria-valuetext"), affichee(), presses()]).toEqual(["480", "8 h", "8 h", ["8 h"]]);
    expect(window.location.search).toBe("?q=3&r=-5&sejour=480");
    await userEvent.click(screen.getByRole("button", { name: "12 h" }));
    expect([curseur().value, presses(), window.location.search]).toEqual(["720", ["12 h"], "?q=3&r=-5&sejour=720"]);
  });

  it("au curseur, chaque pas entre les bornes, sans aller au-delà ; hors des durées prêtes, aucune n'est pressée", () => {
    ouvrir();
    glisser(60 + 3 * pas);
    const entreDeux = formaterMinutes(60 + 3 * pas);
    expect([affichee(), curseur().getAttribute("aria-valuetext"), presses()]).toEqual([entreDeux, entreDeux, []]);
    glisser(max + 10 * pas);
    expect([curseur().value, affichee()]).toEqual([String(max), formaterMinutes(max)]);
    glisser(0);
    expect([curseur().value, affichee()]).toEqual([String(min), formaterMinutes(min)]);
    glisser(240);
    expect(presses()).toEqual(["4 h"]);
  });

  it("au curseur, l'adresse ne garde la durée qu'une fois le geste fini, pas à chaque pas (Safari en limite les réécritures)", () => {
    vi.useFakeTimers();
    ouvrir("?q=3&r=-5");
    const ecritures = vi.spyOn(window.history, "replaceState");
    for (const minutes of [90, 120, 150, 180, 210]) {
      glisser(minutes);
      act(() => vi.advanceTimersByTime(100));
    }
    expect([affichee(), window.location.search, ecritures.mock.calls.length]).toEqual([formaterMinutes(210), "?q=3&r=-5", 0]);
    act(() => vi.advanceTimersByTime(250));
    expect([window.location.search, ecritures.mock.calls.length]).toEqual(["?q=3&r=-5&sejour=210", 1]);
  });

  it("n'écrit pas une durée glissée dans une adresse qu'un lien vient de remplacer", () => {
    vi.useFakeTimers();
    ouvrir("?q=3&r=-5&sejour=240");
    glisser(210);
    aller("");
    act(() => vi.advanceTimersByTime(1000));
    expect([window.location.search, affichee()]).toEqual(["", "1 h"]);
  });

  it("annonce la durée par le curseur seulement, pas une seconde fois par son affichage", () => {
    ouvrir();
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("off");
  });

  it("garde la durée de l'adresse au rechargement ou au retour arrière ; une durée qu'on n'aurait pas pu choisir revient à 1 h", () => {
    ouvrir("?q=3&r=-5&sejour=240");
    expect([curseur().value, affichee(), presses()]).toEqual(["240", "4 h", ["4 h"]]);
    cleanup();
    ouvrir(`?sejour=${min + pas / 2}`);
    expect([curseur().value, affichee()]).toEqual(["60", "1 h"]);
  });

  it("suit l'adresse sans être rouvert : un lien vers l'écran sans durée la remet à 1 h ; un autre bloc qui garde la sienne n'y touche pas", async () => {
    ouvrir("?q=3&r=-5");
    await userEvent.click(screen.getByRole("button", { name: "8 h" }));
    await aller("?q=3&r=-5&sejour=480&explorateurs=2");
    expect([affichee(), presses()]).toEqual(["8 h", ["8 h"]]);
    await aller("?q=3&r=-5&sejour=240");
    expect([curseur().value, affichee(), presses()]).toEqual(["240", "4 h", ["4 h"]]);
    await aller("");
    expect([curseur().value, affichee(), presses()]).toEqual(["60", "1 h", ["1 h"]]);
  });
});
