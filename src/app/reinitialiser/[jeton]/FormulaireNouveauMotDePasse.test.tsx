// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOT_DE_PASSE_TROP_COURT } from "@/comptes/mot-de-passe";
import { FormulaireNouveauMotDePasse } from "./FormulaireNouveauMotDePasse";

describe("formulaire du nouveau mot de passe", () => {
  afterEach(cleanup);

  it("bloque un mot de passe trop court, comme à l'inscription", async () => {
    const choisir = vi.fn(async () => ({}));
    const u = userEvent.setup();
    render(<FormulaireNouveauMotDePasse email="nom@exemple.fr" choisir={choisir} />);
    await u.type(screen.getByLabelText("Mot de passe"), "court");
    await u.click(screen.getByRole("button", { name: "Changer mon mot de passe" }));
    expect(screen.getByRole("alert").textContent).toBe(MOT_DE_PASSE_TROP_COURT);
    expect(choisir).not.toHaveBeenCalled();
  });

  it("propose un nouveau lien quand celui-ci ne sert plus", async () => {
    const choisir = vi.fn(async () => ({ lienPerime: true }));
    const u = userEvent.setup();
    render(<FormulaireNouveauMotDePasse email="nom@exemple.fr" choisir={choisir} />);
    await u.type(screen.getByLabelText("Mot de passe"), "le nouveau mot de passe");
    await u.click(screen.getByRole("button", { name: "Changer mon mot de passe" }));
    expect((await screen.findByRole("link", { name: "Recevoir un nouveau lien" })).getAttribute("href")).toBe("/mot-de-passe-oublie");
  });
});
