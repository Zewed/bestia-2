// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMAIL_INVALIDE, EMAIL_VIDE } from "@/comptes/email";
import type { EtatInscription } from "./etat";

const serveur = vi.hoisted(() => ({ inscrire: vi.fn() }));
vi.mock("./actions", () => serveur);

import { FormulaireInscription } from "./FormulaireInscription";

describe("message sous le champ e-mail", () => {
  beforeEach(() => {
    serveur.inscrire.mockReset();
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({ erreurs: {}, email: String(donnees.get("email")) }));
  });
  afterEach(cleanup);

  const champ = () => screen.getByLabelText("Adresse e-mail");
  const message = () => screen.queryByRole("alert")?.textContent ?? null;

  it("n'apparaît pas pendant la frappe, mais quand on quitte le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@");
    expect(message()).toBeNull();
    await u.tab();
    expect(message()).toBe(EMAIL_INVALIDE);
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    expect(champ().getAttribute("aria-describedby")).toBe("email-erreur");
  });

  it("demande l'adresse quand on quitte le champ vide", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.click(champ());
    await u.tab();
    expect(message()).toBe(EMAIL_VIDE);
  });

  it("s'efface dès qu'on recommence à écrire, et ne revient pas si l'adresse est bonne", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom.fr");
    await u.tab();
    expect(message()).toBe(EMAIL_INVALIDE);
    await u.clear(champ());
    expect(message()).toBeNull();
    await u.type(champ(), "nom@exemple.fr");
    await u.tab();
    expect(message()).toBeNull();
  });

  it("bloque l'envoi d'une adresse mal écrite, sans rien envoyer au serveur", async () => {
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(message()).toBe(EMAIL_INVALIDE);
    expect(document.activeElement).toBe(champ());
    expect(serveur.inscrire).not.toHaveBeenCalled();
  });

  it("montre le refus du serveur, même quand le navigateur a laissé passer", async () => {
    serveur.inscrire.mockImplementation(async (_: EtatInscription, donnees: FormData) => ({
      erreurs: { email: EMAIL_INVALIDE },
      email: String(donnees.get("email")),
    }));
    const u = userEvent.setup();
    render(<FormulaireInscription />);
    await u.type(champ(), "nom@exemple.fr");
    await u.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(serveur.inscrire).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", EMAIL_INVALIDE);
  });
});
