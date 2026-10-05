// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { caractereRefuse, COMMENCER_PAR_UNE_LETTRE, NOM_TROP_COURT } from "@/chefs/nom";
import { FormulaireNomDeChef } from "./FormulaireNomDeChef";

describe("champ du nom de chef (US-0132 à US-0134)", () => {
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

  it("signale un caractère refusé dès qu'il est tapé, et l'oublie dès qu'il est retiré", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Loup@");
    expect(screen.getByRole("alert").textContent).toBe(caractereRefuse("@"));
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    await u.type(champ(), "{Backspace}");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("demande de commencer par une lettre", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "-");
    expect(screen.getByRole("alert").textContent).toBe(COMMENCER_PAR_UNE_LETTRE);
  });

  it("redresse l'apostrophe courbe des téléphones", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "L\u2019Ourse");
    expect(champ().value).toBe("L'Ourse");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("n'écrit ni espace en tête ni deux espaces de suite", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), " Ours  Brun");
    expect(champ().value).toBe("Ours Brun");
    fireEvent.change(champ(), { target: { value: "  Ours   Brun  " } });
    expect(champ().value).toBe("Ours Brun ");
  });

  it("retire l'espace de fin en quittant le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours ");
    expect(champ().value).toBe("Ours ");
    await u.tab();
    expect(champ().value).toBe("Ours");
  });

  it("laisse vide, sans reproche, un champ où l'on n'a tapé que des espaces", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "   ");
    await u.tab();
    expect(champ().value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("garde le curseur où l'on tape quand un espace en trop est retiré", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours Brun");
    await u.type(champ(), " B", { initialSelectionStart: 5, initialSelectionEnd: 5 });
    expect(champ().value).toBe("Ours BBrun");
    expect(champ().selectionStart).toBe(6);
  });
});
