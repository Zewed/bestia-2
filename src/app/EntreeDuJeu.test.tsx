// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EntreeDuJeu } from "./EntreeDuJeu";

const effacerTemoin = () => (document.cookie = "bestia_connecte=; max-age=0; path=/");

describe("entrée du jeu sur la page d'accueil", () => {
  afterEach(() => {
    cleanup();
    effacerTemoin();
  });

  it("propose de créer un compte ou de se connecter à un visiteur", () => {
    render(<EntreeDuJeu />);
    expect(screen.getByRole("link", { name: "Créer un compte" }).getAttribute("href")).toBe("/inscription");
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/connexion");
    expect(screen.queryByRole("link", { name: "Retourner au jeu" })).toBeNull();
  });

  it("propose « Retourner au jeu » à la place des deux boutons à un joueur connecté", () => {
    document.cookie = "bestia_connecte=1; path=/";
    render(<EntreeDuJeu />);
    expect(screen.getByRole("link", { name: "Retourner au jeu" }).getAttribute("href")).toBe("/jeu");
    expect(screen.queryByRole("link", { name: "Créer un compte" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Se connecter" })).toBeNull();
  });
});
