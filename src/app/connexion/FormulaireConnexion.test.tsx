// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const serveur = vi.hoisted(() => ({ seConnecter: vi.fn(async (_: unknown, donnees: FormData) => ({ email: String(donnees.get("email")) })) }));
vi.mock("./actions", () => serveur);

import { FormulaireConnexion } from "./FormulaireConnexion";
import { CONNEXION_REFUSEE } from "./etat";

describe("formulaire de connexion", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    serveur.seConnecter.mockClear();
  });

  const email = () => screen.getByLabelText("Adresse e-mail") as HTMLInputElement;
  const motDePasse = () => screen.getByLabelText("Mot de passe") as HTMLInputElement;

  it("demande l'adresse et le mot de passe, que le navigateur peut remplir avec ce qu'il a enregistré", () => {
    render(<FormulaireConnexion />);
    expect(email().type).toBe("email");
    expect(email().getAttribute("autocomplete")).toBe("username");
    expect(motDePasse().type).toBe("password");
    expect(motDePasse().getAttribute("autocomplete")).toBe("current-password");
    expect(document.querySelectorAll("input")).toHaveLength(2);
  });

  it("a l'œil pour afficher le mot de passe", async () => {
    const u = userEvent.setup();
    render(<FormulaireConnexion />);
    await u.type(motDePasse(), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(motDePasse().type).toBe("text");
    await u.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(motDePasse().type).toBe("password");
  });

  it("reprend l'adresse retenue à l'inscription", async () => {
    sessionStorage.setItem("bestia.adresse-connexion", "nom@exemple.fr");
    render(<FormulaireConnexion />);
    await vi.waitFor(() => expect(email().value).toBe("nom@exemple.fr"));
  });

  it("laisse l'adresse vide sans inscription récente", () => {
    render(<FormulaireConnexion />);
    expect(email().value).toBe("");
  });

  it("mène à l'inscription par « Créer un compte »", () => {
    render(<FormulaireConnexion />);
    expect(screen.getByRole("link", { name: "Créer un compte" }).getAttribute("href")).toBe("/inscription");
  });

  it("envoie au serveur, jamais par l'adresse de la page", async () => {
    const u = userEvent.setup();
    render(<FormulaireConnexion />);
    await u.type(email(), "nom@exemple.fr");
    await u.type(motDePasse(), "une phrase de passe");
    await u.click(screen.getByRole("button", { name: "Se connecter" }));
    await vi.waitFor(() => expect(serveur.seConnecter).toHaveBeenCalledTimes(1));
    expect(location.href).not.toContain("phrase");
  });

  it("affiche le refus et garde l'adresse quand les identifiants sont faux", async () => {
    serveur.seConnecter.mockImplementationOnce(async (_: unknown, donnees: FormData) => ({ erreur: CONNEXION_REFUSEE, email: String(donnees.get("email")) }));
    const u = userEvent.setup();
    render(<FormulaireConnexion />);
    await u.type(email(), "nom@exemple.fr");
    await u.type(motDePasse(), "un mauvais mot de passe");
    await u.click(screen.getByRole("button", { name: "Se connecter" }));
    expect((await screen.findByRole("alert")).textContent).toBe(CONNEXION_REFUSEE);
    expect(email().value).toBe("nom@exemple.fr");
    expect(motDePasse().value).toBe("");
  });
});
