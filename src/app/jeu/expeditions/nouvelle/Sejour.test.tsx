// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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

/** L'écran d'Expédition, à l'adresse `recherche` (« ?q=3&r=-5&sejour=240 ») : un rechargement, ou un retour de la carte. */
const ouvrir = (recherche = "") => {
  window.history.replaceState(null, "", `/jeu/expeditions/nouvelle${recherche}`);
  return render(<Sejour />);
};
const curseur = () => screen.getByRole<HTMLInputElement>("slider", { name: "Durée du séjour" });
const prets = () => within(screen.getByRole("group", { name: "Durées toutes prêtes" })).getAllByRole("button");
/** Les durées toutes prêtes pressées, à leur texte. */
const presses = () => prets().filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
/** La durée choisie, telle qu'elle s'affiche en grand. */
const affichee = () => screen.getByRole("status").textContent;

describe("le séjour sur l'écran d'Expédition (US-0906)", () => {
  afterEach(cleanup);

  it("est un bloc « Séjour » : la durée choisie, un curseur entre ses deux bornes, et les durées toutes prêtes", () => {
    const { container } = ouvrir();
    const bloc = screen.getByRole("heading", { level: 2, name: "Séjour" }).closest("section");
    expect(container.firstChild).toBe(bloc);
    expect(bloc?.textContent).toBe(["Séjour", "1 h", "30 min", "1 j", "1 h", "4 h", "8 h", "12 h"].join(""));
  });

  it("se choisit de 30 min à 24 h, par pas de 30 min, au curseur du formulaire de départ", () => {
    ouvrir();
    expect([curseur().type, curseur().min, curseur().max, curseur().step, curseur().name]).toEqual(["range", "30", "1440", "30", "sejour"]);
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

  it("toucher une durée toute prête la choisit : le curseur y va, la durée affichée suit, et l'adresse la garde", async () => {
    ouvrir("?q=3&r=-5");
    await userEvent.click(screen.getByRole("button", { name: "8 h" }));
    expect([curseur().value, curseur().getAttribute("aria-valuetext"), affichee(), presses()]).toEqual(["480", "8 h", "8 h", ["8 h"]]);
    expect(window.location.search).toBe("?q=3&r=-5&sejour=480");
    await userEvent.click(screen.getByRole("button", { name: "12 h" }));
    expect([curseur().value, presses(), window.location.search]).toEqual(["720", ["12 h"], "?q=3&r=-5&sejour=720"]);
  });

  it("au curseur, toute demi-heure entre les bornes, sans aller au-delà ; hors des durées prêtes, aucune n'est pressée", () => {
    ouvrir();
    fireEvent.change(curseur(), { target: { value: "150" } });
    expect([affichee(), curseur().getAttribute("aria-valuetext"), presses(), window.location.search]).toEqual(["2 h 30", "2 h 30", [], "?sejour=150"]);
    fireEvent.change(curseur(), { target: { value: "5000" } });
    expect([curseur().value, affichee()]).toEqual(["1440", "1 j"]);
    fireEvent.change(curseur(), { target: { value: "0" } });
    expect([curseur().value, affichee()]).toEqual(["30", "30 min"]);
    fireEvent.change(curseur(), { target: { value: "240" } });
    expect(presses()).toEqual(["4 h"]);
  });

  it("garde la durée de l'adresse au rechargement, ou au retour de la carte ; une durée qu'on n'aurait pas pu choisir revient à 1 h", () => {
    ouvrir("?q=3&r=-5&sejour=240");
    expect([curseur().value, affichee(), presses()]).toEqual(["240", "4 h", ["4 h"]]);
    cleanup();
    ouvrir("?sejour=45");
    expect([curseur().value, affichee()]).toEqual(["60", "1 h"]);
  });
});
