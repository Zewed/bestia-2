// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CARTE_CRAN_DE_ZOOM } from "@/reglages";
import { BoutonsDeLaCarte } from "./BoutonsDeLaCarte";

afterEach(cleanup);

/** Les boutons de la carte, sans effet par défaut. */
const Boutons = ({ rapprocher = true, eloigner = true, zoomer = () => {}, revenir = () => {} }: Partial<Parameters<typeof BoutonsDeLaCarte>[0]>) => (
  <BoutonsDeLaCarte rapprocher={rapprocher} eloigner={eloigner} zoomer={zoomer} revenir={revenir} />
);

describe("les boutons de zoom de la carte (US-0425)", () => {
  it("montrent « + » au-dessus de « − », nommés pour les lecteurs d'écran", () => {
    render(<Boutons />);
    const boutons = screen.getAllByRole("button").slice(1);
    expect(boutons.map((b) => [b.textContent, b.getAttribute("aria-label")])).toEqual([
      ["+", "Zoomer"],
      ["−", "Dézoomer"],
    ]);
  });

  it(`zooment d'un cran à chaque appui : des Cases ${CARTE_CRAN_DE_ZOOM} fois plus grandes, ou plus petites`, async () => {
    expect(CARTE_CRAN_DE_ZOOM).toBe(1.5);
    const zoomer = vi.fn();
    render(<Boutons zoomer={zoomer} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Zoomer" }));
    await user.click(screen.getByRole("button", { name: "Dézoomer" }));
    expect(zoomer.mock.calls).toEqual([[1.5], [1 / 1.5]]);
  });

  it("grisent le bouton dont la limite de zoom est atteinte", async () => {
    const zoomer = vi.fn();
    /** Si « Zoomer » et « Dézoomer » sont grisés. */
    const grises = () => ["Zoomer", "Dézoomer"].map((nom) => screen.getByRole<HTMLButtonElement>("button", { name: nom }).disabled);
    const { rerender } = render(<Boutons rapprocher={false} zoomer={zoomer} />);
    expect(grises()).toEqual([true, false]);
    rerender(<Boutons eloigner={false} zoomer={zoomer} />);
    expect(grises()).toEqual([false, true]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Dézoomer" }));
    expect(zoomer).not.toHaveBeenCalled();
  });
});

describe("le bouton du Foyer (US-0426)", () => {
  it("se tient au-dessus de « + », une icône sans texte, nommé « Revenir au Foyer » pour les lecteurs d'écran", () => {
    render(<Boutons />);
    const [foyer] = screen.getAllByRole("button");
    expect(foyer).toBe(screen.getByRole("button", { name: "Revenir au Foyer" }));
    expect(foyer.textContent).toBe("");
    expect(foyer.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("ramène la carte sur le Foyer à chaque appui, même quand le zoom est à ses deux limites", async () => {
    const revenir = vi.fn();
    render(<Boutons rapprocher={false} eloigner={false} revenir={revenir} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Revenir au Foyer" }));
    expect(revenir).toHaveBeenCalledTimes(1);
  });
});
