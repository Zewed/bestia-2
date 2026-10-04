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

  it("dit pourquoi le lien ne sert plus, à la place du formulaire et de son titre (US-0129)", async () => {
    const choisir = vi.fn(async () => ({ lien: "expire" as const }));
    const u = userEvent.setup();
    render(<FormulaireNouveauMotDePasse email="nom@exemple.fr" choisir={choisir} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nouveau mot de passe");
    await u.type(screen.getByLabelText("Mot de passe"), "le nouveau mot de passe");
    await u.click(screen.getByRole("button", { name: "Changer mon mot de passe" }));
    expect((await screen.findByRole("link", { name: "Recevoir un nouveau lien" })).getAttribute("href")).toBe("/mot-de-passe-oublie");
    expect(screen.getAllByRole("heading", { level: 1 }).map((t) => t.textContent)).toEqual(["Ce lien a expiré"]);
    expect(screen.queryByLabelText("Mot de passe")).toBeNull();
  });
});
