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

/**
 * US-0314 : Next.js relie window.history.replaceState à useSearchParams ; la simulation fait de même :
 * la liste relit l'adresse à chaque changement, sans recharger la page.
 */
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const abonnes = new Set<() => void>();
  const remplacer = window.history.replaceState.bind(window.history);
  window.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
    remplacer(...args);
    abonnes.forEach((prevenir) => prevenir());
  };
  const suivre = (prevenir: () => void) => {
    abonnes.add(prevenir);
    return () => abonnes.delete(prevenir);
  };
  return { useSearchParams: () => new URLSearchParams(useSyncExternalStore(suivre, () => window.location.search)) };
});

import { type HabitantAffiche, ListeDesHabitants, type MetierAuChoix } from "./ListeDesHabitants";

/** L'adresse de la page Habitants, avec `recherche` (« ?metier=bucheron ») : un rechargement, ou un lien. */
const ouvrir = (recherche = "") => window.history.replaceState(null, "", `/jeu/habitants${recherche}`);

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
  ouvrir();
});

/** US-0309 : la rangée des compteurs, au-dessus de la liste. */
const rangeeDesEffectifs = () => screen.getByRole("list", { name: "Effectifs par Métier" });
/** US-0309 : chaque compteur tel qu'on le lit : « Bûcheron 2 » ; « Tous » (US-0314) n'en est pas un. */
const effectifs = () =>
  within(rangeeDesEffectifs())
    .getAllByRole("listitem")
    .map((li) => li.textContent)
    .filter((texte) => texte !== "Tous");
/** US-0314 : le bouton d'un compteur, par son nom (« Bûcheron », « Sans Métier »), ou « Tous ». */
const compteur = (nom: string) => within(rangeeDesEffectifs()).getByRole("button", { name: new RegExp(`^${nom}( \\d+)?$`) });
/** US-0314 : les boutons pressés de la rangée, par leur texte. */
const presses = () =>
  within(rangeeDesEffectifs())
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true")
    .map((b) => b.textContent);
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
    expect(within(listeDesHabitants()).queryByRole("button")).toBeNull();
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
    // « Tous » (US-0314) passe en tête.
    const [tous, sansMetier, ...parMetier] = within(rangeeDesEffectifs()).getAllByRole("listitem");
    expect(tous.querySelector("img")).toBeNull();
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

describe("filtrer la liste par Métier (US-0314)", () => {
  /** Les prénoms de la liste, dans son ordre. */
  const prenoms = () => lignes().map((l) => l.split(" · ")[0]);

  it("met « Tous » en premier dans la rangée, pressé tant qu'il n'y a pas de filtre, puis chaque compteur en bouton", () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const boutons = within(rangeeDesEffectifs()).getAllByRole("button");
    expect(boutons.map((b) => b.textContent)).toEqual(["Tous", "Sans Métier 2", ...METIERS.map((m) => `${m.nom} ${m.nom === "Chasseur" ? 1 : 0}`)]);
    expect(boutons.every((b) => b.getAttribute("type") === "button" && b.hasAttribute("aria-pressed"))).toBe(true);
    expect(presses()).toEqual(["Tous"]);
    expect(prenoms()).toEqual(["Arno", "Brune", "Cael"]);
  });

  it("toucher un compteur de Métier filtre la liste sur ce Métier, sans recharger, et l'adresse le garde", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await userEvent.setup().click(compteur("Chasseur"));
    expect(lignes()).toEqual(["Cael · Chasseur · libre"]);
    expect(presses()).toEqual(["Chasseur 1"]);
    expect(window.location.pathname).toBe("/jeu/habitants");
    expect(window.location.search).toBe("?metier=chasseur");
  });

  it("toucher « Sans Métier » filtre sur les Habitants sans Métier", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await userEvent.setup().click(compteur("Sans Métier"));
    expect(prenoms()).toEqual(["Arno", "Brune"]);
    expect(presses()).toEqual(["Sans Métier 2"]);
    expect(window.location.search).toBe("?metier=sans");
  });

  it("« Tous » retire le filtre, de la liste comme de l'adresse ; toucher de nouveau le compteur pressé aussi", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(compteur("Chasseur"));
    await utilisateur.click(compteur("Tous"));
    expect(prenoms()).toEqual(["Arno", "Brune", "Cael"]);
    expect(presses()).toEqual(["Tous"]);
    expect(window.location.search).toBe("");
    await utilisateur.click(compteur("Sans Métier"));
    await utilisateur.click(compteur("Sans Métier"));
    expect(prenoms()).toEqual(["Arno", "Brune", "Cael"]);
    expect(presses()).toEqual(["Tous"]);
    expect(window.location.search).toBe("");
  });

  it("ne change ni les compteurs ni les Métiers au choix", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    const avant = effectifs();
    const utilisateur = userEvent.setup();
    await utilisateur.click(compteur("Chasseur"));
    expect(effectifs()).toEqual(avant);
    await utilisateur.click(compteur("Sans Métier"));
    expect(effectifs()).toEqual(avant);
    await utilisateur.click(choisir("Arno"));
    expect(auChoix("Arno").map((b) => b.textContent)).toEqual(METIERS.map((m) => m.nom));
  });

  it("affiche « Personne n'exerce ce Métier. » à la place de la liste quand le filtre ne trouve personne", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await userEvent.setup().click(compteur("Mineur"));
    expect(screen.getAllByRole("list")).toEqual([rangeeDesEffectifs()]);
    expect(screen.getByText("Personne n'exerce ce Métier.").tagName).toBe("P");
    expect(presses()).toEqual(["Mineur 0"]);
  });

  it("affiche « Personne n'est sans Métier. » quand tous les Habitants en ont un", async () => {
    render(<ListeDesHabitants habitants={[HABITANTS[2]]} metiers={METIERS} />);
    await userEvent.setup().click(compteur("Sans Métier"));
    expect(screen.getAllByRole("list")).toEqual([rangeeDesEffectifs()]);
    expect(screen.getByText("Personne n'est sans Métier.").tagName).toBe("P");
  });

  it("garde le filtre quand on donne un Métier : l'Habitant quitte aussitôt la liste « Sans Métier », et la rejoint s'il n'a pas été donné", async () => {
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    await userEvent.setup().click(compteur("Sans Métier"));
    await donner("Arno", "Bûcheron");
    expect(prenoms()).toEqual(["Brune"]);
    expect(presses()).toEqual(["Sans Métier 1"]);
    await finirLesActions();
    expect(prenoms()).toEqual(["Arno", "Brune"]);
  });

  it("reprend le filtre de l'adresse en arrivant sur la page : un rechargement, ou un lien", () => {
    ouvrir("?metier=chasseur");
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    expect(prenoms()).toEqual(["Cael"]);
    expect(presses()).toEqual(["Chasseur 1"]);
    cleanup();
    ouvrir("?metier=sans");
    render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
    expect(prenoms()).toEqual(["Arno", "Brune"]);
    expect(presses()).toEqual(["Sans Métier 2"]);
  });

  it("ne filtre rien pour un identifiant inconnu dans l'adresse", () => {
    for (const inconnu of ["?metier=druide", "?metier=", "?metier=Chasseur", "?metier=sans%20metier"]) {
      ouvrir(inconnu);
      render(<ListeDesHabitants habitants={HABITANTS} metiers={METIERS} />);
      expect(prenoms(), inconnu).toEqual(["Arno", "Brune", "Cael"]);
      expect(presses(), inconnu).toEqual(["Tous"]);
      cleanup();
    }
  });
});
