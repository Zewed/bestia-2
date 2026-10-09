// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/** Next.js relie window.history.replaceState à useSearchParams ; la simulation fait de même (comme Explorateurs.test.tsx). */
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

import { Explorateurs } from "./Explorateurs";
import { Partir } from "./Partir";
import { SansEscorte } from "./SansEscorte";

/** L'écran d'un joueur sans aucune Bête, réduit à ce qui compte ici, comme la page le range : les explorateurs, l'escorte, le départ. */
const ecran = () =>
  render(
    <>
      <Explorateurs libres={2} total={2} />
      <SansEscorte />
      <Partir libres={2} />
    </>,
  );

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/jeu/expeditions/nouvelle");
});

/** Le bloc Escorte, et ses textes dans l'ordre de la lecture. */
const escorte = () => screen.getByRole("heading", { name: "Escorte" }).closest("section")!;
const textes = () => escorte().innerHTML.replace(/<[^>]+>/g, "|").split("|").filter(Boolean);
const partir = () => screen.getByRole("button", { name: "Partir" }) as HTMLButtonElement;

describe("partir sans escorte (US-0909)", () => {
  it("dit en quelques mots, là où serait l'escorte, que sans elle l'Expédition ne ramènera que des Bêtes communes", () => {
    ecran();
    expect(textes()).toEqual(["Escorte", "Sans escorte, l'Expédition ne ramènera que des Bêtes communes."]);
    // Rien à choisir : ni bouton, ni nombre.
    expect(within(escorte()).queryAllByRole("button")).toEqual([]);
  });

  it("laisse partir au moins un explorateur sans aucune Bête : « Partir » se dégrise, sans rien réclamer d'autre", async () => {
    const joueur = userEvent.setup();
    ecran();
    await joueur.click(screen.getByRole("button", { name: "Un explorateur de plus" }));
    expect(partir().disabled).toBe(false);
    expect(partir().getAttribute("aria-describedby")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Il faut/);
  });
});
