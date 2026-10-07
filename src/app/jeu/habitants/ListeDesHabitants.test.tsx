// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/** L'action serveur, tenue en suspens jusqu'à ce que le test la laisse finir. */
const actions = vi.hoisted(() => {
  const enCours: Array<() => void> = [];
  return {
    enCours,
    donnerUnMetier: vi.fn(() => new Promise<void>((finir) => enCours.push(finir))),
  };
});
vi.mock("./actions", () => actions);

import { type HabitantAffiche, ListeDesHabitants, type MetierAuChoix } from "./ListeDesHabitants";

const METIERS: MetierAuChoix[] = [
  ["explorateur", "Explorateur"],
  ["chasseur", "Chasseur"],
  ["cueilleur", "Cueilleur"],
  ["bucheron", "Bûcheron"],
  ["mineur", "Mineur"],
  ["chercheur", "Chercheur"],
  ["batisseur", "Bâtisseur"],
  ["eleveur", "Éleveur"],
].map(([id, nom]) => ({ id, nom, icone: `/illustrations/metiers/${id}.webp` }));

const HABITANTS: HabitantAffiche[] = [
  { id: 40, prenom: "Arno", metier: null, etat: "libre" },
  { id: 41, prenom: "Brune", metier: null, etat: "libre" },
  { id: 42, prenom: "Cael", metier: "Chasseur", etat: "libre" },
];

describe("donner un Métier depuis la ligne d'un Habitant (US-0308)", () => {
  /** Laisse finir les actions en suspens : React attend qu'elles aient toutes fini pour clore leurs transitions. */
  const finirLesActions = () => act(async () => actions.enCours.splice(0).forEach((finir) => finir()));

  afterEach(async () => {
    await finirLesActions();
    cleanup();
    actions.donnerUnMetier.mockClear();
  });

  /** La ligne d'un Habitant, trouvée par son prénom. */
  const ligne = (prenom: string) => screen.getByText(prenom).closest("li")!;
  /** Le texte de chaque ligne, ses morceaux séparés par « · ». */
  const lignes = () =>
    screen.getAllByRole("listitem").map((li) => [...li.querySelectorAll(":scope > span, :scope > button")].map((e) => e.textContent).join(" · "));
  const choisir = (prenom: string) => within(ligne(prenom)).getByRole("button", { name: "Choisir un Métier" });
  /** Les Métiers dépliés sous une ligne, par leur nom. */
  const auChoix = (prenom: string) => within(ligne(prenom)).queryAllByRole("button").filter((b) => b.textContent !== "Choisir un Métier");

  it("met « Choisir un Métier » sur la ligne d'un Habitant sans Métier, à la place de « sans Métier », et rien sur celle d'un Habitant qui en a un", () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    expect(lignes()).toEqual(["Arno · Choisir un Métier · libre", "Brune · Choisir un Métier · libre", "Cael · Chasseur · libre"]);
    expect(within(ligne("Cael")).queryByRole("button")).toBeNull();
    expect(choisir("Arno").getAttribute("aria-expanded")).toBe("false");
    expect(auChoix("Arno")).toEqual([]);
  });

  it("déplie sous la ligne les huit Métiers, chacun un bouton à son icône muette et à son nom", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await userEvent.setup().click(choisir("Arno"));
    expect(choisir("Arno").getAttribute("aria-expanded")).toBe("true");
    const boutons = auChoix("Arno");
    expect(boutons.map((b) => b.textContent)).toEqual(METIERS.map((m) => m.nom));
    // Le groupe des Métiers suit la ligne de l'Habitant, et le bouton dit lequel il ouvre.
    const groupe = within(ligne("Arno")).getByRole("group", { name: "Métier de Arno" });
    expect(groupe.id).toBe(choisir("Arno").getAttribute("aria-controls"));
    for (const [i, bouton] of boutons.entries()) {
      const icone = bouton.querySelector("img")!;
      expect(icone.getAttribute("alt")).toBe("");
      expect(icone.getAttribute("src")).toContain(encodeURIComponent(`/illustrations/metiers/${METIERS[i].id}.webp`));
      expect(icone.getAttribute("width")).toBe("28");
    }
    expect(actions.donnerUnMetier).not.toHaveBeenCalled();
  });

  it("toucher un Métier le donne : la ligne le montre aussitôt, le dépliant se referme, l'action reçoit l'Habitant et le Métier", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    await utilisateur.click(within(ligne("Arno")).getByRole("button", { name: "Bûcheron" }));
    expect(actions.donnerUnMetier).toHaveBeenCalledExactlyOnceWith(40, "bucheron");
    // L'action n'a pas encore répondu : la ligne montre déjà le nouveau Métier.
    expect(lignes()).toEqual(["Arno · Bûcheron · libre", "Brune · Choisir un Métier · libre", "Cael · Chasseur · libre"]);
    expect(auChoix("Arno")).toEqual([]);
  });

  it("garde le Métier une fois la page relue, qui le montre à son tour, à sa place", async () => {
    const { rerender } = render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    await utilisateur.click(within(ligne("Arno")).getByRole("button", { name: "Bûcheron" }));
    rerender(<ListeDesHabitants habitants={[HABITANTS[1], HABITANTS[2], { ...HABITANTS[0], metier: "Bûcheron" }]} metiers={METIERS} />);
    await finirLesActions();
    expect(lignes()).toEqual(["Brune · Choisir un Métier · libre", "Cael · Chasseur · libre", "Arno · Bûcheron · libre"]);
  });

  it("laisse la page relue faire foi quand le Métier n'a pas été donné", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    await utilisateur.click(within(ligne("Arno")).getByRole("button", { name: "Mineur" }));
    expect(lignes()[0]).toBe("Arno · Mineur · libre");
    // L'action s'achève sans que la page ait changé : l'Habitant reste sans Métier.
    await finirLesActions();
    expect(lignes()[0]).toBe("Arno · Choisir un Métier · libre");
  });

  it("referme d'un second toucher sur « Choisir un Métier », sans rien changer", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    await utilisateur.click(choisir("Arno"));
    expect(choisir("Arno").getAttribute("aria-expanded")).toBe("false");
    expect(auChoix("Arno")).toEqual([]);
    expect(actions.donnerUnMetier).not.toHaveBeenCalled();
  });

  it("referme avec Échap, sans rien changer, et rend la main au bouton", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    within(ligne("Arno")).getByRole("button", { name: "Chasseur" }).focus();
    await utilisateur.keyboard("{Escape}");
    expect(auChoix("Arno")).toEqual([]);
    expect(choisir("Arno").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(choisir("Arno"));
    expect(actions.donnerUnMetier).not.toHaveBeenCalled();
  });

  it("n'ouvre qu'un dépliant à la fois", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(choisir("Arno"));
    await utilisateur.click(choisir("Brune"));
    expect(auChoix("Arno")).toEqual([]);
    expect(choisir("Arno").getAttribute("aria-expanded")).toBe("false");
    expect(auChoix("Brune")).toHaveLength(8);
  });

  it("garde « sans Métier » quand il n'y a aucun Métier à proposer", () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={[]} />);
    expect(lignes()).toEqual(["Arno · sans Métier · libre", "Brune · sans Métier · libre", "Cael · Chasseur · libre"]);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
