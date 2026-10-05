// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serveur = vi.hoisted(() => ({ seDeconnecter: vi.fn(async () => {}) }));
vi.mock("@/comptes/deconnexion", () => serveur);
const recharger = vi.hoisted(() => ({ rechargerVers: vi.fn() }));
vi.mock("./recharger", () => recharger);

import { MenuChef } from "./MenuChef";

describe("nom de chef dans la barre du haut (US-0140)", () => {
  beforeEach(() => {
    serveur.seDeconnecter.mockClear();
    recharger.rechargerVers.mockClear();
  });
  afterEach(cleanup);

  const nom = () => screen.getByRole("button", { name: "Le grand ours de" });

  it("montre le nom, lisible en entier au survol, menu fermé", () => {
    render(<MenuChef nom="Le grand ours de" />);
    expect(nom().getAttribute("title")).toBe("Le grand ours de");
    expect(nom().getAttribute("aria-haspopup")).toBe("menu");
    expect(nom().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("ouvre un menu avec le nom en entier et « Se déconnecter », prêt au clavier", async () => {
    const u = userEvent.setup();
    render(<MenuChef nom="Le grand ours de" />);
    await u.click(nom());
    expect(nom().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("Le grand ours de", { selector: "p" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Se déconnecter" }));
  });

  it("se referme d'un nouveau clic sur le nom", async () => {
    const u = userEvent.setup();
    render(<MenuChef nom="Ourse" />);
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("se referme avec Échap, et rend le regard au nom", async () => {
    const u = userEvent.setup();
    render(<MenuChef nom="Ourse" />);
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    await u.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ourse" }));
  });

  it("se referme d'un clic ailleurs", async () => {
    const u = userEvent.setup();
    render(
      <>
        <MenuChef nom="Ourse" />
        <p>Ailleurs</p>
      </>,
    );
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    await u.click(screen.getByText("Ailleurs"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("se referme quand le clavier quitte le menu", async () => {
    const u = userEvent.setup();
    render(
      <>
        <MenuChef nom="Ourse" />
        <button type="button">Plus loin</button>
      </>,
    );
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    await u.tab();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("déconnecte depuis le menu", async () => {
    const u = userEvent.setup();
    render(<MenuChef nom="Ourse" />);
    await u.click(screen.getByRole("button", { name: "Ourse" }));
    await u.click(screen.getByRole("menuitem", { name: "Se déconnecter" }));
    await vi.waitFor(() => expect(recharger.rechargerVers).toHaveBeenCalledWith("/"));
    expect(serveur.seDeconnecter).toHaveBeenCalledTimes(1);
  });
});
