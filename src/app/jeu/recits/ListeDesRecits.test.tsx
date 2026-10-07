// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ lireUnRecit: vi.fn(async () => {}) }));
vi.mock("./actions", () => actions);

import { ListeDesRecits, type RecitAffiche } from "./ListeDesRecits";

const RECITS: RecitAffiche[] = [
  { id: 43, titre: "Famine", texte: "Deux Habitants sont partis.", instant: "2026-10-07T12:05:00.000Z", quand: "7 octobre 2026 à 14:05", lu: false },
  { id: 41, titre: "Retour de Récolte", texte: "Du Bois.", instant: "2026-10-06T22:30:00.000Z", quand: "7 octobre 2026 à 00:30", lu: true },
];

describe("liste des Récits (US-0324)", () => {
  afterEach(() => {
    cleanup();
    actions.lireUnRecit.mockClear();
  });

  const ligne = (titre: string) => screen.getByRole("button", { name: new RegExp(`^${titre}`) });
  const marques = () => screen.queryAllByText("nouveau").map((m) => m.closest("li")?.querySelector("time")?.textContent);

  it("montre une ligne par Récit dans l'ordre reçu, son texte replié", () => {
    render(<ListeDesRecits recits={RECITS} />);
    expect(screen.getAllByRole("listitem").map((li) => within(li).getByRole("button").textContent)).toEqual([
      "Faminenouveau7 octobre 2026 à 14:05",
      "Retour de Récolte7 octobre 2026 à 00:30",
    ]);
    expect(screen.getByText("Deux Habitants sont partis.").hidden).toBe(true);
    expect(ligne("Famine").getAttribute("aria-expanded")).toBe("false");
  });

  it("marque le Récit non lu, et lui seul", () => {
    render(<ListeDesRecits recits={RECITS} />);
    expect(marques()).toEqual(["7 octobre 2026 à 14:05"]);
  });

  it("ouvrir un Récit non lu déplie son texte sur place, le note comme lu et retire sa marque", async () => {
    render(<ListeDesRecits recits={RECITS} />);
    await userEvent.setup().click(ligne("Famine"));
    expect(ligne("Famine").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Deux Habitants sont partis.").hidden).toBe(false);
    expect(screen.getByText("Deux Habitants sont partis.").id).toBe(ligne("Famine").getAttribute("aria-controls"));
    expect(actions.lireUnRecit).toHaveBeenCalledExactlyOnceWith(43);
    expect(marques()).toEqual([]);
  });

  it("le replie d'un second toucher, sans le noter une seconde fois", async () => {
    render(<ListeDesRecits recits={RECITS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(ligne("Famine"));
    await utilisateur.click(ligne("Famine"));
    expect(ligne("Famine").getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Deux Habitants sont partis.").hidden).toBe(true);
    await utilisateur.click(ligne("Famine"));
    expect(actions.lireUnRecit).toHaveBeenCalledTimes(1);
  });

  it("ouvre un Récit déjà lu sans rien noter", async () => {
    render(<ListeDesRecits recits={RECITS} />);
    await userEvent.setup().click(ligne("Retour de Récolte"));
    expect(screen.getByText("Du Bois.").hidden).toBe(false);
    expect(actions.lireUnRecit).not.toHaveBeenCalled();
  });
});
