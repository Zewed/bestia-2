// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/** Les actions serveur, tenues en suspens jusqu'à ce que le test les laisse finir. */
const actions = vi.hoisted(() => {
  const enCours: Array<() => void> = [];
  const enSuspens = () => new Promise<void>((finir) => enCours.push(finir));
  return {
    enCours,
    donnerUnMetier: vi.fn(enSuspens),
    retirerLeMetier: vi.fn(enSuspens),
    ajouterAuMetier: vi.fn(enSuspens),
    retirerDuMetier: vi.fn(enSuspens),
  };
});
vi.mock("./actions", () => actions);
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

import { BandeauSansMetier } from "./BandeauSansMetier";
import { HabitantsMontres } from "./HabitantsMontres";
import { type HabitantAffiche, ListeDesHabitants } from "./ListeDesHabitants";
import { type MetierARepartir, RepartitionDesMetiers } from "./RepartitionDesMetiers";

const METIERS: MetierARepartir[] = [
  ["chasseur", "Chasseur", "rapporte de la Viande", "avec les Récoltes"],
  ["bucheron", "Bûcheron", "rapporte du Bois des forêts", "avec les Récoltes"],
  ["mineur", "Mineur", "rapporte de la Pierre des montagnes", null],
].map(([id, nom, phrase, servira]) => ({ id: id!, nom: nom!, phrase: phrase!, servira, icone: `/illustrations/metiers/${id}.webp` }));

const HABITANTS: HabitantAffiche[] = [
  { id: 40, prenom: "Arno", metier: null, etat: "libre" },
  { id: 41, prenom: "Brune", metier: null, etat: "libre" },
  { id: 42, prenom: "Cael", metier: "Chasseur", etat: "libre" },
];

/** La page Habitants réduite à ce qui compte ici : le bandeau, la liste et le bloc Métiers, sur les mêmes Habitants. */
const page = (habitants: HabitantAffiche[]) => (
  <HabitantsMontres habitants={habitants}>
    <BandeauSansMetier />
    <ListeDesHabitants habitants={habitants} metiers={METIERS.map(({ id, nom, icone }) => ({ id, nom, icone }))} />
    <RepartitionDesMetiers metiers={METIERS} />
  </HabitantsMontres>
);

/** Laisse finir les actions en suspens : React attend qu'elles aient toutes fini pour clore leurs transitions. */
const finirLesActions = () => act(async () => actions.enCours.splice(0).forEach((finir) => finir()));

afterEach(async () => {
  await finirLesActions();
  cleanup();
  for (const action of [actions.donnerUnMetier, actions.retirerLeMetier, actions.ajouterAuMetier, actions.retirerDuMetier]) action.mockClear();
});

/** Le bloc Métiers. */
const bloc = () => screen.getByRole("heading", { name: "Métiers" }).closest("section")!;
/** La ligne d'un Métier dans le bloc. */
const ligneMetier = (nom: string) => within(bloc()).getByText(nom).closest("li")!;
/** Les morceaux de texte de la ligne d'un Métier. */
const morceaux = (nom: string) => [...ligneMetier(nom).querySelectorAll("strong, button, span, p")].map((e) => e.textContent);
/** Le « + » et le « − » d'un Métier. */
const plus = (nom: string) => within(ligneMetier(nom)).getByRole("button", { name: `Un ${nom} de plus` }) as HTMLButtonElement;
const moins = (nom: string) => within(ligneMetier(nom)).getByRole("button", { name: `Un ${nom} de moins` }) as HTMLButtonElement;
/** L'effectif d'un Métier, entre ses deux boutons. */
const effectif = (nom: string) => plus(nom).previousElementSibling!.textContent;
/** La liste des Habitants, ni les compteurs ni le bloc Métiers, ligne par ligne : prénom et Métier. */
const lignes = () =>
  within(screen.getAllByRole("list").find((l) => !l.hasAttribute("aria-label") && !bloc().contains(l))!)
    .getAllByRole("listitem")
    .map((li) => [...li.querySelectorAll(":scope > span, :scope > button")].slice(0, 2).map((e) => e.textContent).join(" · "));
/** Le bandeau des sans Métier, en son texte, ou null. */
const bandeau = () => screen.queryByRole("link", { name: "Voir" })?.closest("p")?.querySelector("strong")?.textContent ?? null;

describe("répartir les Habitants avec plus et moins, dans le bloc Métiers (US-0312)", () => {
  it("met sur chaque ligne de Métier son icône muette, son nom, son effectif entre « − » et « + », puis sa phrase et quand il servira", () => {
    render(page(HABITANTS));
    expect(morceaux("Chasseur")).toEqual(["Chasseur", "−", "1", "+", "rapporte de la Viande", "Servira avec les Récoltes."]);
    expect(morceaux("Bûcheron")).toEqual(["Bûcheron", "−", "0", "+", "rapporte du Bois des forêts", "Servira avec les Récoltes."]);
    expect(morceaux("Mineur")).toEqual(["Mineur", "−", "0", "+", "rapporte de la Pierre des montagnes"]);
    const icone = ligneMetier("Bûcheron").querySelector("img")!;
    expect(icone.getAttribute("alt")).toBe("");
    expect(icone.getAttribute("width")).toBe("40");
    expect([plus("Bûcheron"), moins("Bûcheron")].map((b) => b.type)).toEqual(["button", "button"]);
  });

  it("« + » donne aussitôt le Métier au premier Habitant sans Métier de la liste : l'effectif, les compteurs, la liste et le bandeau suivent", async () => {
    render(page(HABITANTS));
    await userEvent.setup().click(plus("Bûcheron"));
    expect(actions.ajouterAuMetier).toHaveBeenCalledExactlyOnceWith("bucheron");
    // L'action n'a pas encore répondu.
    expect(effectif("Bûcheron")).toBe("1");
    expect(lignes()).toEqual(["Arno · Bûcheron", "Brune · Choisir un Métier", "Cael · Chasseur"]);
    expect(within(screen.getByRole("list", { name: "Effectifs par Métier" })).getByRole("button", { name: /^Sans Métier/ }).textContent).toBe("Sans Métier 1");
    expect(bandeau()).toBe("1 Habitant sans Métier");
  });

  it("grise « + » partout dès qu'il ne reste aucun Habitant sans Métier", async () => {
    render(page(HABITANTS));
    const utilisateur = userEvent.setup();
    expect(METIERS.map((m) => plus(m.nom).disabled)).toEqual([false, false, false]);
    await utilisateur.click(plus("Bûcheron"));
    await utilisateur.click(plus("Mineur"));
    expect(lignes()).toEqual(["Arno · Bûcheron", "Brune · Mineur", "Cael · Chasseur"]);
    expect(METIERS.map((m) => plus(m.nom).disabled)).toEqual([true, true, true]);
    expect(bandeau()).toBeNull();
  });

  it("grise « − » quand personne n'exerce le Métier", async () => {
    render(page(HABITANTS));
    expect(METIERS.map((m) => moins(m.nom).disabled)).toEqual([false, true, true]);
    await userEvent.setup().click(plus("Mineur"));
    expect(moins("Mineur").disabled).toBe(false);
  });

  it("« − » remet aussitôt sans Métier le dernier arrivé de ce Métier, qui remonte parmi les sans Métier", async () => {
    render(
      page([
        { id: 43, prenom: "Dara", metier: null, etat: "libre" },
        { id: 44, prenom: "Brune", metier: "Chasseur", etat: "libre" },
        { id: 40, prenom: "Cael", metier: "Chasseur", etat: "libre" },
      ]),
    );
    await userEvent.setup().click(moins("Chasseur"));
    expect(actions.retirerDuMetier).toHaveBeenCalledExactlyOnceWith("chasseur");
    // Brune est arrivée après Cael : elle rejoint les sans Métier, à sa place dans l'ordre des prénoms.
    expect(lignes()).toEqual(["Brune · Choisir un Métier", "Dara · Choisir un Métier", "Cael · Chasseur"]);
    expect(effectif("Chasseur")).toBe("1");
    expect(bandeau()).toBe("2 Habitants sans Métier");
  });

  it("laisse la page relue faire foi, quand l'action n'a rien changé", async () => {
    render(page(HABITANTS));
    await userEvent.setup().click(plus("Bûcheron"));
    expect(effectif("Bûcheron")).toBe("1");
    await finirLesActions();
    expect(effectif("Bûcheron")).toBe("0");
    expect(lignes()[0]).toBe("Arno · Choisir un Métier");
    expect(bandeau()).toBe("2 Habitants sans Métier");
  });
});
