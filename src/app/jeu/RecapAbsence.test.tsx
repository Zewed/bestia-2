// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { RecapAbsence } from "./RecapAbsence";

describe("récapitulatif d'absence (US-0216)", () => {
  afterEach(cleanup);

  it("dit ce que le Foyer a produit, et se ferme d'un toucher", async () => {
    render(<RecapAbsence gains={[{ id: "bois", nom: "Bois", gain: "12.900000" }]} />);
    const message = screen.getByRole("button", { name: "Pendant votre absence : +12 Bois" });
    await userEvent.setup().click(message);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ne montre rien quand rien n'a été produit", () => {
    const { container } = render(<RecapAbsence gains={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
