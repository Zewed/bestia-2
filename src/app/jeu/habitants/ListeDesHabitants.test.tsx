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

/** Laisse finir les actions en suspens : React attend qu'elles aient toutes fini pour clore leurs transitions. */
const finirLesActions = () => act(async () => actions.enCours.splice(0).forEach((finir) => finir()));

afterEach(async () => {
  await finirLesActions();
  cleanup();
  actions.donnerUnMetier.mockClear();
});

/** US-0309 : la rangée des compteurs, au-dessus de la liste. */
const rangeeDesEffectifs = () => screen.getByRole("list", { name: "Effectifs par Métier" });
/** US-0309 : chaque compteur tel qu'on le lit : « Bûcheron 2 ». */
const effectifs = () => within(rangeeDesEffectifs()).getAllByRole("listitem").map((li) => li.textContent);
/** La liste des Habitants, sous les compteurs. */
const listeDesHabitants = () => screen.getAllByRole("list").find((liste) => liste !== rangeeDesEffectifs())!;
/** La ligne d'un Habitant, trouvée par son prénom. */
const ligne = (prenom: string) => within(listeDesHabitants()).getByText(prenom).closest("li")!;
/** Le texte de chaque ligne, ses morceaux séparés par « · ». */
const lignes = () =>
  within(listeDesHabitants())
    .getAllByRole("listitem")
    .map((li) => [...li.querySelectorAll(":scope > span, :scope > button")].map((e) => e.textContent).join(" · "));
const choisir = (prenom: string) => within(ligne(prenom)).getByRole("button", { name: "Choisir un Métier" });
/** Les Métiers dépliés sous une ligne, par leur nom. */
const auChoix = (prenom: string) => within(ligne(prenom)).queryAllByRole("button").filter((b) => b.textContent !== "Choisir un Métier");
/** Donne le Métier `nom` à l'Habitant `prenom`, depuis sa ligne. */
async function donner(prenom: string, nom: string) {
  const utilisateur = userEvent.setup();
  await utilisateur.click(choisir(prenom));
  await utilisateur.click(within(ligne(prenom)).getByRole("button", { name: nom }));
}

describe("donner un Métier depuis la ligne d'un Habitant (US-0308)", () => {
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

describe("compter les effectifs par Métier (US-0309)", () => {
  /** Un Habitant par Métier de `metiers` (null : sans Métier). */
  const peuple = (metiers: (string | null)[]): HabitantAffiche[] =>
    metiers.map((metier, i) => ({ id: 60 + i, prenom: `Prenom${i}`, metier, etat: "libre" }));
  /** La somme des compteurs. */
  const somme = () => effectifs().reduce((total, effectif) => total + Number(effectif?.match(/\d+$/)?.[0]), 0);

  it("montre un compteur « Sans Métier », puis un par Métier dans leur ordre, chacun avec son nombre", () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    expect(effectifs()).toEqual([
      "Sans Métier 2",
      "Explorateur 0",
      "Chasseur 1",
      "Cueilleur 0",
      "Bûcheron 0",
      "Mineur 0",
      "Chercheur 0",
      "Bâtisseur 0",
      "Éleveur 0",
    ]);
  });

  it("met devant chaque Métier son icône, petite et muette (le nom est à côté) ; « Sans Métier » n'en a pas", () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const [sansMetier, ...parMetier] = within(rangeeDesEffectifs()).getAllByRole("listitem");
    expect(sansMetier.querySelector("img")).toBeNull();
    for (const [i, compteur] of parMetier.entries()) {
      const icone = compteur.querySelector("img")!;
      expect(icone.getAttribute("alt")).toBe("");
      expect(icone.getAttribute("src")).toContain(encodeURIComponent(METIERS[i].icone));
      expect(icone.getAttribute("width")).toBe("22");
    }
  });

  it("garde à 0 un Métier que personne n'exerce, au lieu de le faire disparaître", () => {
    render(<ListeDesHabitants habitants={peuple([null, null, null])} metiers={METIERS} />);
    expect(effectifs()).toEqual(["Sans Métier 3", ...METIERS.map((m) => `${m.nom} 0`)]);
  });

  it("donne une somme toujours égale au nombre d'Habitants", () => {
    for (const metiers of [
      [null, null, null],
      ["Chasseur", "Chasseur", "Bûcheron"],
      [null, "Éleveur", "Mineur", "Mineur", null, "Explorateur", "Chercheur", "Cueilleur", "Bâtisseur", "Chasseur", "Bûcheron", null],
      ["Mineur"],
    ]) {
      render(<ListeDesHabitants habitants={peuple(metiers)} metiers={METIERS} />);
      expect(somme(), metiers.join(",")).toBe(metiers.length);
      cleanup();
    }
  });

  it("change dès qu'un Métier est donné, sans attendre l'action : un de moins sans Métier, un de plus au Métier donné", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await donner("Arno", "Bûcheron");
    // L'action n'a pas encore répondu.
    expect(effectifs()).toEqual(expect.arrayContaining(["Sans Métier 1", "Bûcheron 1", "Chasseur 1"]));
    expect(somme()).toBe(3);
  });

  it("suit la page relue : le Métier donné reste compté, un Métier refusé ne l'est plus", async () => {
    const { rerender } = render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await donner("Arno", "Bûcheron");
    rerender(<ListeDesHabitants habitants={[HABITANTS[1], HABITANTS[2], { ...HABITANTS[0], metier: "Bûcheron" }]} metiers={METIERS} />);
    await finirLesActions();
    expect(effectifs()).toEqual(expect.arrayContaining(["Sans Métier 1", "Bûcheron 1"]));
    await donner("Brune", "Mineur");
    expect(effectifs()).toEqual(expect.arrayContaining(["Sans Métier 0", "Mineur 1"]));
    // L'action s'achève sans que la page ait changé : Brune reste sans Métier.
    await finirLesActions();
    expect(effectifs()).toEqual(expect.arrayContaining(["Sans Métier 1", "Mineur 0"]));
  });
});
