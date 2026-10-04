// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMAIL_INVALIDE } from "@/comptes/email";
import { JEU_INJOIGNABLE } from "@/app/inscription/etat";

const serveur = vi.hoisted(() => ({ demanderLien: vi.fn(async (_: unknown, d: FormData) => ({ envoye: true, email: String(d.get("email")) })) }));
vi.mock("./actions", () => serveur);

import { LIEN_PEUT_ETRE_PARTI } from "./etat";
import { FormulaireOubli } from "./FormulaireOubli";

describe("« Mot de passe oublié »", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    serveur.demanderLien.mockClear();
  });

  const champ = () => screen.getByLabelText("Adresse e-mail") as HTMLInputElement;

  it("donne la même réponse quoi qu'il arrive, et ramène à la connexion avec l'adresse", async () => {
    const u = userEvent.setup();
    render(<FormulaireOubli />);
    await u.type(champ(), "nom@exemple.fr");
    await u.click(screen.getByRole("button", { name: "Recevoir un lien" }));
    const reponse = await screen.findByRole("status");
    expect(reponse.textContent).toContain(LIEN_PEUT_ETRE_PARTI);
    expect(reponse.textContent).toContain("valable 60 minutes");
    const retour = screen.getByRole("link", { name: "Revenir à la connexion" });
    retour.addEventListener("click", (e) => e.preventDefault());
    await u.click(retour);
    expect(sessionStorage.getItem("bestia.adresse-connexion")).toBe("nom@exemple.fr");
  });

  it("reprend l'adresse tapée à la connexion", async () => {
    sessionStorage.setItem("bestia.adresse-connexion", "nom@exemple.fr");
    render(<FormulaireOubli />);
    await vi.waitFor(() => expect(champ().value).toBe("nom@exemple.fr"));
  });

  it("signale une adresse mal écrite sans rien envoyer", async () => {
    const u = userEvent.setup();
    render(<FormulaireOubli />);
    await u.type(champ(), "nom@");
    await u.click(screen.getByRole("button", { name: "Recevoir un lien" }));
    expect(screen.getByRole("alert").textContent).toBe(EMAIL_INVALIDE);
    expect(serveur.demanderLien).not.toHaveBeenCalled();
  });

  it("prévient sans détail technique quand le jeu ne répond pas", async () => {
    serveur.demanderLien.mockRejectedValueOnce(new Error("Failed to fetch"));
    const u = userEvent.setup();
    render(<FormulaireOubli />);
    await u.type(champ(), "nom@exemple.fr");
    await u.click(screen.getByRole("button", { name: "Recevoir un lien" }));
    expect((await screen.findByRole("alert")).textContent).toBe(JEU_INJOIGNABLE);
  });
});
