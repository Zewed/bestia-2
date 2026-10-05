// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serveur = vi.hoisted(() => ({ seDeconnecter: vi.fn(async () => {}) }));
vi.mock("@/comptes/deconnexion", () => serveur);
const recharger = vi.hoisted(() => ({ rechargerVers: vi.fn() }));
vi.mock("./recharger", () => recharger);

import { BoutonDeconnexion } from "./Deconnexion";

describe("« Se déconnecter » (US-0120)", () => {
  beforeEach(() => {
    serveur.seDeconnecter.mockClear();
    recharger.rechargerVers.mockClear();
  });
  afterEach(cleanup);

  it("ferme la session côté jeu, puis recharge la page d'accueil en entier", async () => {
    const u = userEvent.setup();
    render(<BoutonDeconnexion />);
    await u.click(screen.getByRole("button", { name: "Se déconnecter" }));
    await vi.waitFor(() => expect(recharger.rechargerVers).toHaveBeenCalledWith("/"));
    expect(serveur.seDeconnecter).toHaveBeenCalledTimes(1);
    expect(serveur.seDeconnecter.mock.invocationCallOrder[0]).toBeLessThan(recharger.rechargerVers.mock.invocationCallOrder[0]);
  });
});
