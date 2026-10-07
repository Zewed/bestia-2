// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuxPortes, type VoyageurAffiche } from "./AuxPortes";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
/** L'heure du jeu à l'affichage. */
const MAINTENANT = new Date("2026-10-07T18:00:00Z");
/** Un Voyageur arrivé il y a `ms` millisecondes de jeu. */
const voyageur = (id: number, prenom: string, ms: number): VoyageurAffiche => ({ id, prenom, arriveLe: new Date(MAINTENANT.getTime() - ms) });

describe("les Voyageurs aux portes (US-0332)", () => {
  afterEach(cleanup);

  const partie = () => screen.getByRole("heading", { name: "Aux portes" }).closest("section")!;
  /** Le texte de chaque ligne, ses morceaux séparés par « · ». */
  const lignes = () => within(partie()).queryAllByRole("listitem").map((li) => [...li.children].map((e) => e.textContent).join(" · "));

  it("forment une partie « Aux portes », titrée comme les autres blocs", () => {
    render(<AuxPortes voyageurs={[]} maintenant={MAINTENANT} />);
    expect(within(partie()).getByRole("heading", { level: 2 }).textContent).toBe("Aux portes");
  });

  it("y sont chacun sur une ligne, dans l'ordre de la lecture, du premier arrivé au dernier : son prénom, et depuis quand il attend", () => {
    render(<AuxPortes voyageurs={[voyageur(3, "Arno", 5 * HEURE), voyageur(1, "Brune", 2 * HEURE + 20 * MINUTE), voyageur(2, "Cael", 12 * MINUTE)]} maintenant={MAINTENANT} />);
    expect(lignes()).toEqual(["Arno · arrivé il y a 5 h", "Brune · arrivé il y a 2 h", "Cael · arrivé il y a 12 min"]);
  });

  it.each([
    [30_000, "arrivé à l'instant"],
    [MINUTE, "arrivé il y a 1 min"],
    [59 * MINUTE + 59_000, "arrivé il y a 59 min"],
    [HEURE, "arrivé il y a 1 h"],
    [11 * HEURE + 59 * MINUTE, "arrivé il y a 11 h"],
  ])("disent depuis quand ils attendent, en heures du jeu : %i ms, « %s »", (ms, depuis) => {
    render(<AuxPortes voyageurs={[voyageur(1, "Arno", ms)]} maintenant={MAINTENANT} />);
    expect(lignes()).toEqual([`Arno · ${depuis}`]);
  });

  it("laissent, quand personne n'attend, « Personne aux portes pour l'instant. », sans liste vide", () => {
    render(<AuxPortes voyageurs={[]} maintenant={MAINTENANT} />);
    expect([...partie().children].map((e) => [e.tagName, e.textContent])).toEqual([
      ["H2", "Aux portes"],
      ["P", "Personne aux portes pour l'instant."],
    ]);
  });

  it("n'offrent encore aucun bouton : accueillir et refuser viendront ensuite", () => {
    render(<AuxPortes voyageurs={[voyageur(1, "Arno", HEURE)]} maintenant={MAINTENANT} />);
    expect(within(partie()).queryAllByRole("button")).toEqual([]);
    expect(within(partie()).queryAllByRole("link")).toEqual([]);
  });
});
