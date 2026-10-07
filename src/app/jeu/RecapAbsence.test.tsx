// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { RecapAbsence } from "./RecapAbsence";

describe("récapitulatif d'absence (US-0216)", () => {
  afterEach(cleanup);

  it("dit ce que le Foyer a produit, et se ferme d'un toucher", async () => {
    render(<RecapAbsence recap={{ gains: [{ id: "bois", nom: "Bois", gain: "12.900000" }], pleins: [] }} />);
    const message = screen.getByRole("button", { name: "Pendant votre absence : +12 Bois" });
    await userEvent.setup().click(message);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("dit aussi quels Stocks se sont remplis, et depuis quand (US-0228)", () => {
    render(
      <RecapAbsence
        recap={{ gains: [{ id: "viande", nom: "Viande", gain: "80.000000" }, { id: "bois", nom: "Bois", gain: "10.000000" }], pleins: [{ id: "bois", nom: "Bois", depuis: "4 h" }] }}
      />,
    );
    const lignes = [...screen.getByRole("button").children].map((ligne) => ligne.textContent?.trim());
    expect(lignes).toEqual(["Pendant votre absence : +80 Viande, +10 Bois", "Bois : stock plein depuis 4 h"]);
  });

  it("ne montre rien quand rien n'a été produit", () => {
    const { container } = render(<RecapAbsence recap={{ gains: [], pleins: [] }} />);
    expect(container.innerHTML).toBe("");
  });
});
