// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VOYAGEUR_ALERTE_MINUTES, VOYAGEUR_ATTEND_HEURES } from "@/reglages";

/** Les actions serveur, tenues en suspens jusqu'à ce que le test les laisse finir, avec ce qu'elles rendent. */
const actions = vi.hoisted(() => {
  const enCours: Array<(rendu?: unknown) => void> = [];
  return {
    enCours,
    accueillirUnVoyageur: vi.fn(() => new Promise<unknown>((finir) => enCours.push(finir))),
    refuserUnVoyageur: vi.fn(() => new Promise<unknown>((finir) => enCours.push(finir))),
  };
});
vi.mock("./actions-aux-portes", () => actions);

import { AuxPortes, type VoyageurAffiche } from "./AuxPortes";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
/** L'heure du jeu à l'affichage. */
const MAINTENANT = new Date("2026-10-07T18:00:00Z");
/** US-0338 : la place qui reste au Foyer, de 5 places pour 3 Habitants. */
const LIBRES = 2;
/** Un Voyageur arrivé il y a `ms` millisecondes de jeu, qui repart VOYAGEUR_ATTEND_HEURES heures après son arrivée. */
const voyageur = (id: number, prenom: string, ms: number): VoyageurAffiche => {
  const arriveLe = new Date(MAINTENANT.getTime() - ms);
  return { id, prenom, arriveLe, departLe: new Date(arriveLe.getTime() + VOYAGEUR_ATTEND_HEURES * HEURE) };
};
/** Un Voyageur à qui il reste `ms` millisecondes de jeu avant son départ. */
const partantDans = (id: number, prenom: string, ms: number) => voyageur(id, prenom, VOYAGEUR_ATTEND_HEURES * HEURE - ms);

const partie = () => screen.getByRole("heading", { name: "Aux portes" }).closest("section")!;
/** Les morceaux de chaque ligne, le prénom, depuis quand, puis le compte à rebours, sans ses boutons (US-0334). */
const morceaux = () => within(partie()).queryAllByRole("listitem").map((li) => [...li.querySelectorAll(":scope > span")]);
/** Le texte de chaque ligne, ses morceaux séparés par « · ». */
const lignes = () => morceaux().map((m) => m.map((e) => e.textContent).join(" · "));
/** Le compte à rebours de chaque ligne. */
const comptes = () => morceaux().map((m) => m[2].textContent);
/** Les comptes à rebours dans la couleur d'alerte. */
const enAlerte = () => morceaux().map((m) => m[2].hasAttribute("data-alerte"));
/** Les prénoms aux portes, dans l'ordre des lignes. */
const prenoms = () => morceaux().map((m) => m[0].textContent);
/** US-0334 : la ligne d'un Voyageur, trouvée par son prénom. */
const ligne = (prenom: string) => within(partie()).getByText(prenom).closest("li")!;

/**
 * Laisse finir les actions en suspens, chacune rendant `rendu` : React attend qu'elles aient toutes fini pour clore
 * leurs transitions.
 */
const finirLesActions = (rendu?: unknown) => act(async () => actions.enCours.splice(0).forEach((finir) => finir(rendu)));

afterEach(async () => {
  await finirLesActions();
  cleanup();
  vi.useRealTimers();
  actions.accueillirUnVoyageur.mockClear();
  actions.refuserUnVoyageur.mockClear();
});

describe("les Voyageurs aux portes (US-0332)", () => {
  /** Le prénom et depuis quand, sans le compte à rebours (US-0333). */
  const debuts = () => lignes().map((l) => l.split(" · ").slice(0, 2).join(" · "));

  it("forment une partie « Aux portes », titrée comme les autres blocs", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[]} maintenant={MAINTENANT} />);
    expect(within(partie()).getByRole("heading", { level: 2 }).textContent).toBe("Aux portes");
  });

  it("y sont chacun sur une ligne, dans l'ordre de la lecture, du premier arrivé au dernier : son prénom, et depuis quand il attend", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(3, "Arno", 5 * HEURE), voyageur(1, "Brune", 2 * HEURE + 20 * MINUTE), voyageur(2, "Cael", 12 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(debuts()).toEqual(["Arno · arrivé il y a 5 h", "Brune · arrivé il y a 2 h", "Cael · arrivé il y a 12 min"]);
  });

  it.each([
    [30_000, "arrivé à l'instant"],
    [MINUTE, "arrivé il y a 1 min"],
    [59 * MINUTE + 59_000, "arrivé il y a 59 min"],
    [HEURE, "arrivé il y a 1 h"],
    [11 * HEURE + 59 * MINUTE, "arrivé il y a 11 h"],
  ])("disent depuis quand ils attendent, en heures du jeu : %i ms, « %s »", (ms, depuis) => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(1, "Arno", ms)]} maintenant={MAINTENANT} />);
    expect(debuts()).toEqual([`Arno · ${depuis}`]);
  });

  it("laissent, quand personne n'attend, « Personne aux portes pour l'instant. », sans liste vide", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[]} maintenant={MAINTENANT} />);
    expect([...partie().children].map((e) => [e.tagName, e.textContent])).toEqual([
      ["H2", "Aux portes"],
      // US-0342 : le lien vers l'historique, en tête de la partie.
      ["A", "Historique"],
      ["P", "Personne aux portes pour l'instant."],
    ]);
  });

});

describe("l'historique des Voyageurs (US-0342)", () => {
  it("s'ouvre par un lien « Historique », en tête de la partie, juste après son titre, qui mène aux Voyageurs passés", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const lien = within(partie()).getByRole("link", { name: "Historique" });
    expect(lien.getAttribute("href")).toBe("/jeu/habitants/voyageurs");
    expect([...partie().children].slice(0, 2)).toEqual([within(partie()).getByRole("heading", { name: "Aux portes" }), lien]);
  });

  it("garde le lien quand personne n'attend, et quand la place manque", () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={[]} maintenant={MAINTENANT} />);
    expect(within(partie()).getByRole("link", { name: "Historique" })).toBeTruthy();
    rerender(<AuxPortes placesLibres={0} voyageurs={TROIS} maintenant={MAINTENANT} />);
    expect(within(partie()).getByRole("link", { name: "Historique" })).toBeTruthy();
  });
});

/** Trois Voyageurs aux portes, du premier arrivé au dernier. */
const TROIS = [voyageur(70, "Ines", 3 * HEURE), voyageur(71, "Joran", 2 * HEURE), voyageur(72, "Ilda", 20 * MINUTE)];

describe("accueillir un Voyageur (US-0334)", () => {
  it("met sur la ligne de chaque Voyageur un bouton « Accueillir », qui dit pour un lecteur d'écran qui il accueille", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    for (const { prenom } of TROIS) {
      const bouton = within(ligne(prenom)).getByRole("button", { name: `Accueillir ${prenom}` });
      expect(bouton.textContent).toBe("Accueillir");
      expect(bouton.getAttribute("type")).toBe("button");
    }
    expect(actions.accueillirUnVoyageur).not.toHaveBeenCalled();
  });

  it("toucher « Accueillir » retire aussitôt la ligne, sans attendre l'action, qui reçoit le Voyageur", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Joran")).getByRole("button", { name: "Accueillir Joran" }));
    expect(actions.accueillirUnVoyageur).toHaveBeenCalledExactlyOnceWith(71);
    // L'action n'a pas encore répondu : la ligne est déjà partie, les autres restent dans leur ordre.
    expect(prenoms()).toEqual(["Ines", "Ilda"]);
  });

  it("laisse « Personne aux portes pour l'instant. » dès que le dernier Voyageur est accueilli", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[TROIS[0]]} maintenant={MAINTENANT} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Accueillir Ines" }));
    expect(within(partie()).queryByRole("list")).toBeNull();
    expect(within(partie()).getByText("Personne aux portes pour l'instant.")).toBeTruthy();
  });

  it("ne remontre pas la ligne une fois la page relue, qui ne compte plus le Voyageur aux portes", async () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS.slice(1)} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    await finirLesActions();
    expect(prenoms()).toEqual(["Joran", "Ilda"]);
  });

  it("laisse la page relue faire foi quand le Voyageur n'a pas été accueilli", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(prenoms()).toEqual(["Joran", "Ilda"]);
    // L'action s'achève sans que la page ait changé : Ines attend toujours.
    await finirLesActions();
    expect(prenoms()).toEqual(["Ines", "Joran", "Ilda"]);
  });

  it("accueille plusieurs Voyageurs à la suite, sans attendre que le premier accueil réponde", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    await utilisateur.click(within(ligne("Ilda")).getByRole("button", { name: "Accueillir Ilda" }));
    expect(actions.accueillirUnVoyageur.mock.calls).toEqual([[70], [72]]);
    expect(prenoms()).toEqual(["Joran"]);
  });
});

describe("refuser un Voyageur (US-0336)", () => {
  it("met sur la ligne de chaque Voyageur, après « Accueillir », un bouton « Refuser », qui dit pour un lecteur d'écran qui il refuse", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    for (const { prenom } of TROIS) {
      expect(within(ligne(prenom)).getAllByRole("button").map((b) => [b.textContent, b.getAttribute("aria-label"), b.getAttribute("type")])).toEqual([
        ["Accueillir", `Accueillir ${prenom}`, "button"],
        ["Refuser", `Refuser ${prenom}`, "button"],
      ]);
    }
    expect(actions.refuserUnVoyageur).not.toHaveBeenCalled();
  });

  it("toucher « Refuser » retire aussitôt la ligne, sans attendre l'action, qui reçoit le Voyageur, sans l'accueillir", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Joran")).getByRole("button", { name: "Refuser Joran" }));
    expect(actions.refuserUnVoyageur).toHaveBeenCalledExactlyOnceWith(71);
    expect(actions.accueillirUnVoyageur).not.toHaveBeenCalled();
    expect(prenoms()).toEqual(["Ines", "Ilda"]);
  });

  it("ne remontre pas la ligne une fois la page relue, et laisse « Personne aux portes pour l'instant. » quand tous sont partis", async () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={[TROIS[0], TROIS[1]]} maintenant={MAINTENANT} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Refuser Ines" }));
    await utilisateur.click(within(ligne("Joran")).getByRole("button", { name: "Accueillir Joran" }));
    expect(within(partie()).getByText("Personne aux portes pour l'instant.")).toBeTruthy();
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={[]} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    await finirLesActions();
    expect(within(partie()).queryByRole("list")).toBeNull();
    expect(within(partie()).getByText("Personne aux portes pour l'instant.")).toBeTruthy();
  });

  it("laisse la page relue faire foi quand le Voyageur n'a pas été refusé", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ilda")).getByRole("button", { name: "Refuser Ilda" }));
    expect(prenoms()).toEqual(["Ines", "Joran"]);
    await finirLesActions();
    expect(prenoms()).toEqual(["Ines", "Joran", "Ilda"]);
  });
});

describe("accueillir un Voyageur déjà reparti (US-0337)", () => {
  /** Les messages d'alerte de la partie « Aux portes ». */
  const alertes = () => within(partie()).queryAllByRole("alert").map((a) => a.textContent);

  it("dit « Ce Voyageur est déjà reparti. » dans la partie, et la page relue ne le montre plus aux portes", async () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(alertes()).toEqual([]);
    // La page relue ne compte plus Ines aux portes ; l'accueil revient : elle était déjà repartie.
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS.slice(1)} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    await finirLesActions("reparti");
    expect(alertes()).toEqual(["Ce Voyageur est déjà reparti."]);
    expect(prenoms()).toEqual(["Joran", "Ilda"]);
  });

  it("le dit aussi quand plus personne n'attend", async () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={[TROIS[0]]} maintenant={MAINTENANT} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Accueillir Ines" }));
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={[]} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    await finirLesActions("reparti");
    expect(alertes()).toEqual(["Ce Voyageur est déjà reparti."]);
    expect(within(partie()).getByText("Personne aux portes pour l'instant.")).toBeTruthy();
  });

  it.each([["accueilli"], ["absent"], [undefined]])("ne dit rien quand l'accueil revient autrement : %s", async (rendu) => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    await finirLesActions(rendu);
    expect(alertes()).toEqual([]);
  });

  it("efface le message au choix suivant", async () => {
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS.slice(1)} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    await finirLesActions("reparti");
    expect(alertes()).toEqual(["Ce Voyageur est déjà reparti."]);

    await utilisateur.click(within(ligne("Joran")).getByRole("button", { name: "Refuser Joran" }));
    expect(alertes()).toEqual([]);
  });
});

describe("bloquer l'accueil quand la place manque (US-0338)", () => {
  const PHRASE = "Plus de place au Foyer. Des huttes en ajouteront quand les constructions seront là.";
  /** Les boutons « Accueillir » de la partie, grisés ou non, dans l'ordre des lignes. */
  const grises = () => within(partie()).getAllByRole("button", { name: /^Accueillir / }).map((b) => (b as HTMLButtonElement).disabled);
  /** Les phrases de la partie qui disent que la place manque. */
  const phrases = () => within(partie()).queryAllByText(PHRASE);

  it("grise « Accueillir » sur chaque ligne quand toute la place est prise, toujours lu avec qui il accueille, sans toucher à « Refuser »", () => {
    render(<AuxPortes placesLibres={0} voyageurs={TROIS} maintenant={MAINTENANT} />);
    for (const { prenom } of TROIS) {
      expect((within(ligne(prenom)).getByRole("button", { name: `Accueillir ${prenom}` }) as HTMLButtonElement).disabled).toBe(true);
      expect((within(ligne(prenom)).getByRole("button", { name: `Refuser ${prenom}` }) as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it("dit une seule fois, dans la partie, qu'il n'y a plus de place et que des huttes en ajouteront, et chaque « Accueillir » grisé y renvoie", () => {
    render(<AuxPortes placesLibres={0} voyageurs={TROIS} maintenant={MAINTENANT} />);
    expect(phrases()).toHaveLength(1);
    const id = phrases()[0].id;
    expect(id).not.toBe("");
    for (const { prenom } of TROIS) expect(within(ligne(prenom)).getByRole("button", { name: `Accueillir ${prenom}` }).getAttribute("aria-describedby")).toBe(id);
  });

  it("n'accueille personne d'un toucher sur « Accueillir » grisé ; « Refuser » reste possible", async () => {
    render(<AuxPortes placesLibres={0} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(actions.accueillirUnVoyageur).not.toHaveBeenCalled();
    expect(prenoms()).toEqual(["Ines", "Joran", "Ilda"]);
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Refuser Ines" }));
    expect(actions.refuserUnVoyageur).toHaveBeenCalledExactlyOnceWith(70);
  });

  it("laisse accueillir, sans rien dire, tant qu'il reste une place", () => {
    render(<AuxPortes placesLibres={1} voyageurs={TROIS} maintenant={MAINTENANT} />);
    expect(grises()).toEqual([false, false, false]);
    expect(phrases()).toEqual([]);
    for (const { prenom } of TROIS) expect(within(ligne(prenom)).getByRole("button", { name: `Accueillir ${prenom}` }).hasAttribute("aria-describedby")).toBe(false);
  });

  it("ne dit rien quand personne n'attend", () => {
    render(<AuxPortes placesLibres={0} voyageurs={[]} maintenant={MAINTENANT} />);
    expect(phrases()).toEqual([]);
    expect(within(partie()).getByText("Personne aux portes pour l'instant.")).toBeTruthy();
  });

  it("laisse de nouveau accueillir dès que la page relue donne de la place, le Voyageur ayant attendu", () => {
    const { rerender } = render(<AuxPortes placesLibres={0} voyageurs={TROIS} maintenant={MAINTENANT} />);
    expect(grises()).toEqual([true, true, true]);
    rerender(<AuxPortes placesLibres={1} voyageurs={TROIS} maintenant={new Date(MAINTENANT.getTime() + 2_000)} />);
    expect(grises()).toEqual([false, false, false]);
    expect(phrases()).toEqual([]);
  });

  it("compte d'avance la place que prend un accueil en cours : la dernière prise, les autres « Accueillir » se grisent aussitôt", async () => {
    render(<AuxPortes placesLibres={1} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(prenoms()).toEqual(["Joran", "Ilda"]);
    expect(grises()).toEqual([true, true]);
    expect(phrases()).toHaveLength(1);
    // L'accueil n'a pas eu lieu et la page relue n'a pas changé : la place est toujours libre.
    await finirLesActions("plus-de-place");
    expect(grises()).toEqual([false, false, false]);
    expect(phrases()).toEqual([]);
  });

  it("ne compte pas d'avance la place d'un refus en cours", async () => {
    render(<AuxPortes placesLibres={1} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().click(within(ligne("Ines")).getByRole("button", { name: "Refuser Ines" }));
    expect(grises()).toEqual([false, false]);
  });
});

describe("ne jamais accueillir deux fois (US-0339)", () => {
  it("n'envoie qu'un accueil pour un double clic sur « Accueillir »", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    await userEvent.setup().dblClick(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(actions.accueillirUnVoyageur).toHaveBeenCalledExactlyOnceWith(70);
  });

  it("ne relance rien pour un Voyageur dont un choix est en cours, même touché de nouveau avant que sa ligne parte", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const [accueillir, refuser] = within(ligne("Ines")).getAllByRole("button");
    // Trois touchers avant que React ne retire la ligne.
    act(() => {
      accueillir.click();
      accueillir.click();
      refuser.click();
    });
    expect(actions.accueillirUnVoyageur).toHaveBeenCalledExactlyOnceWith(70);
    expect(actions.refuserUnVoyageur).not.toHaveBeenCalled();
  });

  it("laisse de nouveau choisir pour ce Voyageur une fois l'action finie, s'il attend toujours", async () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={TROIS} maintenant={MAINTENANT} />);
    const utilisateur = userEvent.setup();
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    await finirLesActions("plus-de-place");
    await utilisateur.click(within(ligne("Ines")).getByRole("button", { name: "Accueillir Ines" }));
    expect(actions.accueillirUnVoyageur.mock.calls).toEqual([[70], [70]]);
  });
});

describe("le compte à rebours d'un Voyageur (US-0333)", () => {
  it("dit, au bout de sa ligne, dans combien de temps il repart, à la minute supérieure", () => {
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(1, "Joran", 18 * MINUTE), voyageur(2, "Ilda", 5 * HEURE), partantDans(3, "Maëlle", 42 * MINUTE + 10_000)]} maintenant={MAINTENANT} />);
    expect(lignes()).toEqual(["Joran · arrivé il y a 18 min · repart dans 11 h 42", "Ilda · arrivé il y a 5 h · repart dans 7 h", "Maëlle · arrivé il y a 11 h · repart dans 43 min"]);
  });

  it("diminue en direct, sans recharger la page, au rythme du jeu", async () => {
    vi.useFakeTimers();
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 11 h 42"]);
    await act(async () => vi.advanceTimersByTime(59_000));
    expect(comptes()).toEqual(["repart dans 11 h 42"]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(lignes()).toEqual(["Joran · arrivé il y a 19 min · repart dans 11 h 41"]);
  });

  it("va plus vite quand le temps du jeu est accéléré : à ×60, une minute de jeu par seconde", async () => {
    vi.useFakeTimers();
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} vitesse={60} />);
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(comptes()).toEqual(["repart dans 11 h 39"]);
  });

  it(`passe dans la couleur d'alerte sous ${VOYAGEUR_ALERTE_MINUTES} minutes, et pas avant`, async () => {
    vi.useFakeTimers();
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[partantDans(1, "Joran", 3 * HEURE), partantDans(2, "Ilda", 60 * MINUTE + 30_000), partantDans(3, "Maëlle", 59 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 3 h", "repart dans 1 h 01", "repart dans 59 min"]);
    expect(enAlerte()).toEqual([false, false, true]);
    // Une minute plus tard, Ilda passe sous l'heure : l'alerte vient avec « 59 min », pas plus tôt.
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 2 h 59", "repart dans 1 h", "repart dans 58 min"]);
    expect(enAlerte()).toEqual([false, false, true]);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 2 h 58", "repart dans 59 min", "repart dans 57 min"]);
    expect(enAlerte()).toEqual([false, true, true]);
  });

  it("affiche « sur le départ », toujours en alerte, quand le compte arrive à zéro, et jamais de temps négatif", async () => {
    vi.useFakeTimers();
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[partantDans(1, "Joran", 90_000), partantDans(2, "Ilda", 0), partantDans(3, "Maëlle", -2 * HEURE)]} maintenant={MAINTENANT} />);
    expect(comptes()).toEqual(["repart dans 2 min", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(comptes()).toEqual(["repart dans 1 min", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(comptes()).toEqual(["sur le départ", "sur le départ", "sur le départ"]);
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(comptes()).toEqual(["sur le départ", "sur le départ", "sur le départ"]);
    expect(enAlerte()).toEqual([true, true, true]);
  });

  it("repart de la nouvelle heure du jeu quand la page est relue, sans compter deux fois le temps passé", async () => {
    vi.useFakeTimers();
    const joran = voyageur(1, "Joran", 18 * MINUTE);
    const { rerender } = render(<AuxPortes placesLibres={LIBRES} voyageurs={[joran]} maintenant={MAINTENANT} />);
    await act(async () => vi.advanceTimersByTime(5 * MINUTE));
    expect(comptes()).toEqual(["repart dans 11 h 37"]);
    // La barre recale la page (US-0213) : le serveur donne la nouvelle heure du jeu, cinq minutes plus tard.
    rerender(<AuxPortes placesLibres={LIBRES} voyageurs={[joran]} maintenant={new Date(MAINTENANT.getTime() + 5 * MINUTE)} />);
    expect(comptes()).toEqual(["repart dans 11 h 37"]);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(comptes()).toEqual(["repart dans 11 h 36"]);
  });

  it("ne se fait pas réannoncer à chaque minute par un lecteur d'écran : aucune zone annoncée", async () => {
    vi.useFakeTimers();
    render(<AuxPortes placesLibres={LIBRES} voyageurs={[voyageur(1, "Joran", 18 * MINUTE)]} maintenant={MAINTENANT} />);
    await act(async () => vi.advanceTimersByTime(MINUTE));
    expect(partie().querySelectorAll("[aria-live], [role=status], [role=timer], [role=alert], [role=log], [role=marquee]")).toHaveLength(0);
  });
});
