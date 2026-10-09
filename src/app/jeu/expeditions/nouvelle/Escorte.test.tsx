// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EspeceDisponible } from "@/monde/effectif";

/**
 * Next.js relie window.history.replaceState à useSearchParams ; la simulation fait de même : l'écran relit
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

import { Escorte } from "./Escorte";

/** Deux Espèces de l'effectif, rangées comme la base les rend, et une Espèce sans illustration. */
const POULE: EspeceDisponible = { id: "poule", nom: "Poule", illustration: "especes/poule.webp", disponibles: 1 };
const SOURIS: EspeceDisponible = { id: "souris", nom: "Souris grise", illustration: "especes/souris.webp", disponibles: 3 };
const SANS_ILLUSTRATION: EspeceDisponible = { id: "bete_d_essai", nom: "Bête d'essai", illustration: null, disponibles: 2 };

/** L'adresse de l'écran d'Expédition, avec `recherche` (« ?q=3&r=-5 ») : un rechargement, ou un lien. */
const ouvrir = (recherche = "") => window.history.replaceState(null, "", `/jeu/expeditions/nouvelle${recherche}`);
const ecran = (especes: EspeceDisponible[] = [POULE, SOURIS]) => render(<Escorte especes={especes} />);

afterEach(() => {
  cleanup();
  ouvrir();
});

/** Le bloc Escorte. */
const bloc = () => screen.getByRole("heading", { name: "Escorte" }).closest("section")!;
/** Ses textes, dans l'ordre de la lecture. */
const textes = () => bloc().innerHTML.replace(/<[^>]+>/g, "|").split("|").filter(Boolean);
/** Les choix d'une Espèce, nommés par elle, et sa ligne entière. */
const choix = (nom: string) => within(bloc()).getByRole("group", { name: nom });
const ligne = (nom: string) => choix(nom).closest("li")!;
/** Un bouton des choix d'une Espèce, et le nombre de ses Bêtes qui partent. */
const bouton = (nom: string, bouton: string) => within(choix(nom)).getByRole("button", { name: bouton }) as HTMLButtonElement;
const choisies = (nom: string) => within(choix(nom)).getByRole("status").textContent;
/** Ce qui est grisé parmi « − », « + », « Toutes » et « Aucune ». */
const grises = (nom: string) => ["Une Bête de moins", "Une Bête de plus", "Toutes", "Aucune"].filter((b) => bouton(nom, b).disabled);

describe("choisir l'escorte (US-0904)", () => {
  it("propose chaque Espèce de l'effectif avec le nombre de Bêtes disponibles, puis combien partent", () => {
    ecran();
    expect(textes()).toEqual([
      "Escorte",
      "Poule",
      "1 disponible",
      "−",
      "0",
      "+",
      "Toutes",
      "Aucune",
      "Souris grise",
      "3 disponibles",
      "−",
      "0",
      "+",
      "Toutes",
      "Aucune",
    ]);
  });

  it("montre l'illustration de chaque Espèce, et la tête de loup pour une Espèce qui n'en a pas", () => {
    ecran([SOURIS, SANS_ILLUSTRATION]);
    const portrait = within(ligne("Souris grise")).getByRole("img", { name: "Souris grise" });
    expect(portrait.getAttribute("src")).toContain(encodeURIComponent("/illustrations/especes/souris.webp"));
    const loup = within(ligne("Bête d'essai")).getByRole("img", { name: "Bête d'essai" });
    expect(loup.tagName).toBe("DIV");
    expect(loup.querySelector("svg")).not.toBeNull();
  });

  it("ne propose pas d'escorte sans aucune Bête : le bloc n'apparaît pas", () => {
    const { container } = ecran([]);
    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("heading", { name: "Escorte" })).toBeNull();
  });

  it("part de zéro Bête pour chaque Espèce : « − » et « Aucune » grisés", () => {
    ecran();
    expect([choisies("Poule"), choisies("Souris grise")]).toEqual(["0", "0"]);
    expect(grises("Souris grise")).toEqual(["Une Bête de moins", "Aucune"]);
  });

  it("ajoute et retire une Bête à la fois, sans jamais dépasser le nombre disponible", async () => {
    const joueur = userEvent.setup();
    ecran();
    await joueur.click(bouton("Souris grise", "Une Bête de plus"));
    await joueur.click(bouton("Souris grise", "Une Bête de plus"));
    expect(choisies("Souris grise")).toBe("2");
    expect(grises("Souris grise")).toEqual([]);
    await joueur.click(bouton("Souris grise", "Une Bête de moins"));
    expect(choisies("Souris grise")).toBe("1");
    // La seule Poule : « + » et « Toutes » se grisent à la première.
    await joueur.click(bouton("Poule", "Une Bête de plus"));
    expect(choisies("Poule")).toBe("1");
    expect(grises("Poule")).toEqual(["Une Bête de plus", "Toutes"]);
    await joueur.click(bouton("Poule", "Une Bête de plus"));
    expect(choisies("Poule")).toBe("1");
  });

  it("« Toutes » prend le maximum d'une Espèce, « Aucune » la remet à zéro, sans toucher aux autres", async () => {
    const joueur = userEvent.setup();
    ecran();
    await joueur.click(bouton("Poule", "Une Bête de plus"));
    await joueur.click(bouton("Souris grise", "Toutes"));
    expect([choisies("Poule"), choisies("Souris grise")]).toEqual(["1", "3"]);
    expect(grises("Souris grise")).toEqual(["Une Bête de plus", "Toutes"]);
    await joueur.click(bouton("Souris grise", "Aucune"));
    expect([choisies("Poule"), choisies("Souris grise")]).toEqual(["1", "0"]);
    expect(grises("Souris grise")).toEqual(["Une Bête de moins", "Aucune"]);
  });

  it("ne retient aucune Bête : le nombre disponible ne bouge pas tant qu'on choisit", async () => {
    const joueur = userEvent.setup();
    ecran();
    await joueur.click(bouton("Souris grise", "Toutes"));
    expect(within(ligne("Souris grise")).getByText("3 disponibles")).toBeTruthy();
  });

  it("garde l'escorte dans l'adresse, avec les autres choix, pour la retrouver au rechargement", async () => {
    const joueur = userEvent.setup();
    ouvrir("?q=3&r=-5&explorateurs=2");
    ecran();
    await joueur.click(bouton("Souris grise", "Une Bête de plus"));
    await joueur.click(bouton("Souris grise", "Une Bête de plus"));
    await joueur.click(bouton("Poule", "Toutes"));
    expect(window.location.search).toBe("?q=3&r=-5&explorateurs=2&escorte=poule.1&escorte=souris.2");
    cleanup();
    ecran();
    expect([choisies("Poule"), choisies("Souris grise")]).toEqual(["1", "2"]);
    // À zéro, l'adresse ne dit plus rien de l'escorte.
    await joueur.click(bouton("Poule", "Aucune"));
    await joueur.click(bouton("Souris grise", "Aucune"));
    expect(window.location.search).toBe("?q=3&r=-5&explorateurs=2");
  });

  it("ne croit pas l'adresse : jamais plus que les disponibles, ni moins que zéro, ni une Espèce que l'écran ne propose pas", async () => {
    for (const [recherche, attendu] of [
      ["?escorte=souris.9", "3"],
      ["?escorte=souris.-1", "0"],
      ["?escorte=souris.1.5", "0"],
      ["?escorte=souris.deux", "0"],
      ["?escorte=souris", "0"],
      ["?escorte=Souris.2", "0"],
      ["?escorte=souris.2&escorte=souris.1", "2"],
    ] as const) {
      ouvrir(recherche);
      ecran();
      expect([recherche, choisies("Souris grise"), choisies("Poule")]).toEqual([recherche, attendu, "0"]);
      cleanup();
    }
    // Le premier choix nettoie l'adresse : ce qui n'y valait rien n'y reste pas.
    const joueur = userEvent.setup();
    ouvrir("?escorte=pigeon.2&escorte=souris.9");
    ecran();
    await joueur.click(bouton("Souris grise", "Une Bête de moins"));
    expect(window.location.search).toBe("?escorte=souris.2");
  });
});
