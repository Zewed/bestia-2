// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caractereRefuse, COMMENCER_PAR_UNE_LETTRE, NOM_DEJA_PRIS, NOM_NON_AUTORISE, NOM_TROP_COURT, NOM_VIENT_D_ETRE_PRIS } from "@/chefs/nom";
import { NOM_DE_CHEF_PAUSE_MS } from "@/reglages";
import { NOM_DEFINITIF, type EtatValidation } from "./etat";

const actions = vi.hoisted(() => ({
  verifierNomLibre: vi.fn<(nom: string) => Promise<string | null>>(async () => null),
  validerNomDeChef: vi.fn<(precedent: EtatValidation, donnees: FormData) => Promise<EtatValidation>>(async () => ({ nom: "" })),
}));
vi.mock("./actions", () => actions);

import { FormulaireNomDeChef } from "./FormulaireNomDeChef";

describe("champ du nom de chef (US-0132 à US-0136)", () => {
  afterEach(() => {
    cleanup();
    actions.verifierNomLibre.mockReset();
    actions.verifierNomLibre.mockResolvedValue(null);
  });
  const champ = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Nom de chef" });

  it("montre le compteur dès qu'on écrit, pas avant", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    expect(screen.queryByText(/\/16$/)).toBeNull();
    await u.type(champ(), "Élan");
    expect(screen.getByText("4/16")).toBeTruthy();
  });

  it("ne prend pas plus de 16 caractères, à la frappe comme au collage", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Dix-sept lettres!");
    expect(champ().value).toBe("Dix-sept lettres");
    fireEvent.change(champ(), { target: { value: "Le grand ours des montagnes" } });
    expect(champ().value).toBe("Le grand ours de");
    expect(screen.getByText("16/16")).toBeTruthy();
  });

  it("signale un nom trop court en quittant le champ, et l'oublie dès qu'on reprend", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ou");
    expect(screen.queryByRole("alert")).toBeNull();
    await u.tab();
    expect(screen.getByRole("alert").textContent).toBe(NOM_TROP_COURT);
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    await u.type(champ(), "r");
    expect(screen.queryByRole("alert")).toBeNull();
    await u.tab();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ne reproche rien à un champ quitté sans y avoir écrit", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.click(champ());
    await u.tab();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("signale un caractère refusé dès qu'il est tapé, et l'oublie dès qu'il est retiré", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Loup@");
    expect(screen.getByRole("alert").textContent).toBe(caractereRefuse("@"));
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    await u.type(champ(), "{Backspace}");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("demande de commencer par une lettre", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "-");
    expect(screen.getByRole("alert").textContent).toBe(COMMENCER_PAR_UNE_LETTRE);
  });

  it("redresse l'apostrophe courbe des téléphones", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "L\u2019Ourse");
    expect(champ().value).toBe("L'Ourse");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("n'écrit ni espace en tête ni deux espaces de suite", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), " Ours  Brun");
    expect(champ().value).toBe("Ours Brun");
    fireEvent.change(champ(), { target: { value: "  Ours   Brun  " } });
    expect(champ().value).toBe("Ours Brun ");
  });

  it("retire l'espace de fin en quittant le champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours ");
    expect(champ().value).toBe("Ours ");
    await u.tab();
    expect(champ().value).toBe("Ours");
  });

  it("laisse vide, sans reproche, un champ où l'on n'a tapé que des espaces", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "   ");
    await u.tab();
    expect(champ().value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("garde le curseur où l'on tape quand un espace en trop est retiré", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours Brun");
    await u.type(champ(), " B", { initialSelectionStart: 5, initialSelectionEnd: 5 });
    expect(champ().value).toBe("Ours BBrun");
    expect(champ().selectionStart).toBe(6);
  });

  it("dit qu'un nom est déjà pris en quittant le champ, et l'oublie dès qu'on le change", async () => {
    actions.verifierNomLibre.mockResolvedValue(NOM_DEJA_PRIS);
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours Brun ");
    await u.tab();
    expect(actions.verifierNomLibre).toHaveBeenCalledWith("Ours Brun");
    expect((await screen.findByRole("alert")).textContent).toBe(NOM_DEJA_PRIS);
    expect(champ().getAttribute("aria-invalid")).toBe("true");
    await u.type(champ(), "e");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ne cherche pas un nom déjà refusé par une autre règle", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ou");
    await u.tab();
    expect(screen.getByRole("alert").textContent).toBe(NOM_TROP_COURT);
    expect(actions.verifierNomLibre).not.toHaveBeenCalled();
  });

  it("ne dit rien si le jeu ne répond pas", async () => {
    actions.verifierNomLibre.mockRejectedValue(new Error("injoignable"));
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await u.tab();
    await new Promise((fin) => setTimeout(fin, 0));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("disponibilité du nom pendant la saisie (US-0136)", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    actions.verifierNomLibre.mockReset();
    actions.verifierNomLibre.mockResolvedValue(null);
  });

  const champ = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Nom de chef" });
  /** Une horloge simulée : la pause d'une demi-seconde passe d'un coup. */
  function horloge() {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  }
  const attendre = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it("cherche le nom quand le joueur s'arrête de taper, pas à chaque lettre", async () => {
    expect(NOM_DE_CHEF_PAUSE_MS).toBe(500);
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await attendre(NOM_DE_CHEF_PAUSE_MS - 100);
    expect(actions.verifierNomLibre).not.toHaveBeenCalled();
    await attendre(100);
    expect(actions.verifierNomLibre).toHaveBeenCalledTimes(1);
    expect(actions.verifierNomLibre).toHaveBeenCalledWith("Ourse");
  });

  it("montre « disponible » sans rien réserver, et « déjà pris » sans attendre qu'on quitte le champ", async () => {
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    expect(screen.getByRole("status").textContent).toBe("Disponible");
    actions.verifierNomLibre.mockResolvedValue(NOM_DEJA_PRIS);
    await u.type(champ(), "s");
    expect(screen.getByRole("status").textContent).toBe("");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    expect(screen.getByRole("alert").textContent).toBe(NOM_DEJA_PRIS);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("ne redemande pas un nom déjà cherché", async () => {
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    await u.type(champ(), "x{Backspace}");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    await u.tab();
    expect(actions.verifierNomLibre).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe("Disponible");
  });

  it("cherche tout de suite si le joueur quitte le champ avant la fin de la pause, une seule fois", async () => {
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await u.tab();
    expect(actions.verifierNomLibre).toHaveBeenCalledTimes(1);
    await attendre(NOM_DE_CHEF_PAUSE_MS * 2);
    expect(actions.verifierNomLibre).toHaveBeenCalledTimes(1);
  });

  it("ne cherche pas un nom refusé par une autre règle", async () => {
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ou");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    await u.clear(champ());
    await u.type(champ(), "Loup@");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    expect(actions.verifierNomLibre).not.toHaveBeenCalled();
  });

  it("dit qu'un nom n'est pas autorisé, sans coche (US-0138)", async () => {
    actions.verifierNomLibre.mockResolvedValue(NOM_NON_AUTORISE);
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Le Con");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    expect(screen.getByRole("alert").textContent).toBe(NOM_NON_AUTORISE);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("demande séparément deux noms de même forme mais de sens différent (« Le Con », « Leçon »)", async () => {
    actions.verifierNomLibre.mockImplementation(async (nom: string) => (nom === "Le Con" ? NOM_NON_AUTORISE : null));
    const u = horloge();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Le Con");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    await u.clear(champ());
    await u.type(champ(), "Leçon");
    await attendre(NOM_DE_CHEF_PAUSE_MS);
    expect(actions.verifierNomLibre).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Disponible");
  });
});

describe("valider le nom de chef (US-0139)", () => {
  // Un envoi laissé en suspens retiendrait les mises à jour des tests suivants : React lie entre
  // elles toutes les actions en cours. Chacun est libéré à la fin de son test.
  const liberations: (() => void)[] = [];
  const enSuspens = () => new Promise<never>((_, refus) => liberations.push(() => refus(new Error("fin du test"))));

  afterEach(() => {
    liberations.splice(0).forEach((liberer) => liberer());
    cleanup();
    actions.verifierNomLibre.mockReset();
    actions.verifierNomLibre.mockResolvedValue(null);
    actions.validerNomDeChef.mockReset();
    actions.validerNomDeChef.mockResolvedValue({ nom: "" });
  });

  const champ = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Nom de chef" });
  const bouton = () => screen.getByRole<HTMLButtonElement>("button");

  it("n'active « Valider » que pour un nom qui respecte les règles du champ", async () => {
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    expect(bouton().disabled).toBe(true);
    await u.type(champ(), "Ou");
    expect(bouton().disabled).toBe(true);
    await u.type(champ(), "@");
    expect(bouton().disabled).toBe(true);
    await u.type(champ(), "{Backspace}rse");
    expect(bouton().disabled).toBe(false);
  });

  it("le grise pour un nom que le jeu a dit pris ou interdit", async () => {
    actions.verifierNomLibre.mockResolvedValue(NOM_NON_AUTORISE);
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await u.tab();
    await screen.findByRole("alert");
    expect(bouton().disabled).toBe(true);
  });

  it("envoie le nom tel qu'il sera enregistré", async () => {
    actions.validerNomDeChef.mockImplementation(enSuspens);
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ours Brun ");
    await u.click(bouton());
    expect(actions.validerNomDeChef).toHaveBeenCalledTimes(1);
    expect(actions.validerNomDeChef.mock.calls[0][1].get("nom")).toBe("Ours Brun");
  });

  it("montre « Validation… » pendant l'envoi, bouton grisé", async () => {
    actions.validerNomDeChef.mockImplementation(enSuspens);
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse{Enter}");
    expect(bouton().textContent).toBe("Validation…");
    expect(bouton().disabled).toBe(true);
  });

  it("dit « Ce nom vient d'être pris » si la coche était affichée, et garde la saisie (US-0137)", async () => {
    actions.validerNomDeChef.mockImplementation(async (_precedent, donnees) => ({ nom: String(donnees.get("nom")), pris: true }));
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse");
    await u.tab();
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Disponible"));
    await u.click(bouton());
    expect((await screen.findByRole("alert")).textContent).toBe(NOM_VIENT_D_ETRE_PRIS);
    expect(champ().value).toBe("Ourse");
    expect(bouton().disabled).toBe(true);
  });

  it("dit « Ce nom est déjà pris » si le joueur a validé sans attendre la coche", async () => {
    actions.verifierNomLibre.mockImplementation(enSuspens);
    actions.validerNomDeChef.mockImplementation(async (_precedent, donnees) => ({ nom: String(donnees.get("nom")), pris: true }));
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse{Enter}");
    expect((await screen.findByRole("alert")).textContent).toBe(NOM_DEJA_PRIS);
    expect(champ().value).toBe("Ourse");
  });

  it("montre le refus du serveur sous le champ", async () => {
    actions.validerNomDeChef.mockImplementation(async (_precedent, donnees) => ({ nom: String(donnees.get("nom")), erreur: NOM_NON_AUTORISE }));
    const u = userEvent.setup();
    render(<FormulaireNomDeChef />);
    await u.type(champ(), "Ourse{Enter}");
    expect((await screen.findByRole("alert")).textContent).toBe(NOM_NON_AUTORISE);
  });

  it("prévient, d'une ligne, que le nom est définitif", () => {
    render(<FormulaireNomDeChef />);
    expect(screen.getByText(NOM_DEFINITIF)).toBeTruthy();
    expect(NOM_DEFINITIF).toBe("Ce nom ne pourra plus être changé");
  });
});

