// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const adresse = vi.hoisted(() => ({ page: "/jeu" }));
vi.mock("next/navigation", () => ({ usePathname: () => adresse.page }));

import { Navigation } from "./Navigation";

describe("navigation du jeu (US-0302)", () => {
  afterEach(() => {
    cleanup();
    adresse.page = "/jeu";
  });

  const entrees = () => within(screen.getByRole("navigation")).getAllByRole("link");
  const marquees = () => entrees().filter((lien) => lien.getAttribute("aria-current") === "page").map((lien) => lien.textContent);

  it("mène au Foyer puis aux Habitants", () => {
    render(<Navigation />);
    expect(entrees().map((lien) => [lien.textContent, lien.getAttribute("href")])).toEqual([
      ["Foyer", "/jeu"],
      ["Habitants", "/jeu/habitants"],
    ]);
  });

  it("marque l'entrée de la page affichée, et elle seule", () => {
    render(<Navigation />);
    expect(marquees()).toEqual(["Foyer"]);
    cleanup();
    adresse.page = "/jeu/habitants";
    render(<Navigation />);
    expect(marquees()).toEqual(["Habitants"]);
  });

  it("ne marque pas le Foyer sur une autre page du jeu", () => {
    adresse.page = "/jeu/arrivee";
    render(<Navigation />);
    expect(marquees()).toEqual([]);
  });

  it("porte la marque des onglets, qui réserve leur hauteur en bas de la page sur mobile (BarreHaut.test.tsx)", () => {
    render(<Navigation />);
    expect(screen.getByRole("navigation").hasAttribute("data-onglets")).toBe(true);
  });
});
