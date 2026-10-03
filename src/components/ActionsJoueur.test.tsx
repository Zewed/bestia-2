// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => navigation);
const serveur = vi.hoisted(() => ({ seDeconnecter: vi.fn(async () => {}) }));
vi.mock("@/comptes/deconnexion", () => serveur);
const recharger = vi.hoisted(() => ({ rechargerVers: vi.fn() }));
vi.mock("./recharger", () => recharger);

import { ActionsJoueur } from "./ActionsJoueur";

describe("« Se déconnecter » dans la barre du haut", () => {
  beforeEach(() => {
    serveur.seDeconnecter.mockClear();
    recharger.rechargerVers.mockClear();
  });
  afterEach(cleanup);

  it.each(["/", "/inscription", "/connexion"])("n'apparaît pas hors du jeu (%s)", (chemin) => {
    navigation.usePathname.mockReturnValue(chemin);
    render(<ActionsJoueur />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("apparaît sur les pages du jeu", () => {
    navigation.usePathname.mockReturnValue("/jeu");
    render(<ActionsJoueur />);
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeTruthy();
  });

  it("ferme la session côté jeu, puis recharge la page d'accueil en entier", async () => {
    navigation.usePathname.mockReturnValue("/jeu");
    const u = userEvent.setup();
    render(<ActionsJoueur />);
    await u.click(screen.getByRole("button", { name: "Se déconnecter" }));
    await vi.waitFor(() => expect(recharger.rechargerVers).toHaveBeenCalledWith("/"));
    expect(serveur.seDeconnecter).toHaveBeenCalledTimes(1);
    expect(serveur.seDeconnecter.mock.invocationCallOrder[0]).toBeLessThan(recharger.rechargerVers.mock.invocationCallOrder[0]);
  });
});
