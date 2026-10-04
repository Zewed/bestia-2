// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { NOM_TROP_COURT } from "@/chefs/nom";
import { FormulaireNomDeChef } from "./FormulaireNomDeChef";

describe("champ du nom de chef (US-0132)", () => {
  afterEach(cleanup);
  const champ = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Nom de chef" });

  it("montre le compteur dès qu'on écrit, pas avant", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    expect(screen.queryByText(/\/16$/)).toBeNull();
    await u.type(champ(), "Élan");
    expect(screen.getByText("4/16")).toBeTruthy();
  });

  it("ne prend pas plus de 16 caractères, à la frappe comme au collage", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Dix-sept lettres!");
    expect(champ().value).toBe("Dix-sept lettres");
    fireEvent.change(champ(), { target: { value: "Le grand ours des montagnes" } });
    expect(champ().value).toBe("Le grand ours de");
    expect(screen.getByText("16/16")).toBeTruthy();
  });

  it("signale un nom trop court en quittant le champ, et l'oublie dès qu'on reprend", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ou");
    expect(screen.queryByRole("alert")).toBeNull();
    await u.tab();
    expect(screen.getByRole("alert").textContent).toBe(NOM_TROP_COURT);
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    await u.type(champ(), "r");
    expect(screen.queryByRole("alert")).toBeNull();
    await u.tab();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ne reproche rien à un champ quitté sans y avoir écrit", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.click(champ());
    await u.tab();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("garde « Valider » grisé jusqu'à l'enregistrement du nom (US-0139)", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Valider" }).disabled).toBe(true);
  });
});
