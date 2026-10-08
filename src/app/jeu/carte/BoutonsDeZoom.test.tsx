// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CARTE_CRAN_DE_ZOOM } from "@/reglages";
import { BoutonsDeZoom } from "./BoutonsDeZoom";

afterEach(cleanup);

describe("les boutons de zoom de la carte (US-0425)", () => {
  it("montrent « + » au-dessus de « − », nommés pour les lecteurs d'écran", () => {
    render(<BoutonsDeZoom rapprocher eloigner zoomer={() => {}} />);
    const boutons = screen.getAllByRole("button");
    expect(boutons.map((b) => [b.textContent, b.getAttribute("aria-label")])).toEqual([
      ["+", "Zoomer"],
      ["−", "Dézoomer"],
    ]);
  });

  it(`zooment d'un cran à chaque appui : des Cases ${CARTE_CRAN_DE_ZOOM} fois plus grandes, ou plus petites`, async () => {
    expect(CARTE_CRAN_DE_ZOOM).toBe(1.5);
    const zoomer = vi.fn();
    render(<BoutonsDeZoom rapprocher eloigner zoomer={zoomer} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Zoomer" }));
    await user.click(screen.getByRole("button", { name: "Dézoomer" }));
    expect(zoomer.mock.calls).toEqual([[1.5], [1 / 1.5]]);
  });

  it("grisent le bouton dont la limite de zoom est atteinte", async () => {
    const zoomer = vi.fn();
    /** Si « Zoomer » et « Dézoomer » sont grisés. */
    const grises = () => ["Zoomer", "Dézoomer"].map((nom) => screen.getByRole<HTMLButtonElement>("button", { name: nom }).disabled);
    const { rerender } = render(<BoutonsDeZoom rapprocher={false} eloigner zoomer={zoomer} />);
    expect(grises()).toEqual([true, false]);
    rerender(<BoutonsDeZoom rapprocher eloigner={false} zoomer={zoomer} />);
    expect(grises()).toEqual([false, true]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Dézoomer" }));
    expect(zoomer).not.toHaveBeenCalled();
  });
});
