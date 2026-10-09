// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { ExpeditionEnCours } from "@/expeditions/en-cours";
import { DetailDeLExpedition } from "./DetailDeLExpedition";

afterEach(cleanup);

const MINUTE_MS = 60_000;
/** Le départ : 9 h 42 à Paris. */
const DEPART = new Date("2026-10-09T07:42:00.000Z");
/** Une heure du jeu, `minutes` après le départ. */
const apres = (minutes: number) => new Date(DEPART.getTime() + minutes * MINUTE_MS);

/**
 * Une Expédition partie vers une forêt à 3 Cases du Foyer : 1 h d'aller, 4 h de séjour, 1 h de retour, avec deux
 * explorateurs et une escorte de deux Espèces, rangées comme la base les rend.
 */
const FORET: ExpeditionEnCours = {
  id: 5,
  destination: { q: 3, r: -5, biome: "Forêt", chef: null, aVous: false, zone: 0, distance: 3, anneau: 3 },
  phase: "aller",
  partLe: DEPART,
  trajetMinutes: 60,
  sejourMinutes: 240,
  explorateurs: ["Joran", "Ines"],
  escorte: [
    { id: "poule", nom: "Poule", nombre: 1 },
    { id: "souris", nom: "Souris grise", nombre: 2 },
  ],
};

/** La ligne de l'Expédition : ses textes, dans l'ordre de la lecture. */
const ligne = () => [...document.querySelectorAll("[data-ligne] > *")].map((morceau) => morceau.textContent).filter(Boolean);
/** Son détail : chaque étiquette et ce qu'elle dit. */
const detail = () => Object.fromEntries([...document.querySelectorAll("dl > div")].map((l) => [l.querySelector("dt")!.textContent, l.querySelector("dd")!.textContent]));
const deplier = () => screen.getByRole("button", { name: "Détail" });

describe("le détail d'une Expédition en cours (US-0918)", () => {
  it("montre sa destination et sa distance, sa phase et son temps restant, puis ses explorateurs, son escorte et son retour prévu", () => {
    render(<DetailDeLExpedition expedition={FORET} instant={apres(18)} />);
    expect(ligne()).toEqual(["Forêt", "3 Cases de votre Foyer", "Aller", "arrive dans 42 min"]);
    expect(detail()).toEqual({
      Explorateurs: "Joran, Ines",
      // Le nombre ne quitte jamais son Espèce : des espaces insécables, comme au récapitulatif (US-0910).
      Escorte: "Poule × 1, Souris grise × 2",
      // 9 h 42 à Paris, plus 1 h d'aller, 4 h de séjour et 1 h de retour.
      "Retour prévu": "9 octobre à 15:42",
    });
    expect(document.querySelector("time")?.getAttribute("dateTime")).toBe("2026-10-09T13:42:00.000Z");
  });

  it("compte à rebours la phase en cours : l'arrivée à l'aller, la durée choisie en séjour, la rentrée au retour", () => {
    const { rerender } = render(<DetailDeLExpedition expedition={FORET} instant={apres(60)} />);
    expect(ligne().slice(2)).toEqual(["Séjour", "repart dans 4 h"]);
    rerender(<DetailDeLExpedition expedition={FORET} instant={apres(60 + 239.5)} />);
    expect(ligne().slice(2)).toEqual(["Séjour", "repart dans 1 min"]);
    rerender(<DetailDeLExpedition expedition={FORET} instant={apres(60 + 240 + 25)} />);
    expect(ligne().slice(2)).toEqual(["Retour", "rentre dans 35 min"]);
    // Rentrée, elle quitte la liste avec son retour au Foyer (US-0916) ; d'ici là, elle y est « de retour ».
    rerender(<DetailDeLExpedition expedition={FORET} instant={apres(60 + 240 + 60)} />);
    expect(ligne().slice(2)).toEqual(["Retour", "de retour"]);
  });

  it("lit sa phase à l'heure qu'on lui donne, pas à celle où la liste a été lue", () => {
    render(<DetailDeLExpedition expedition={{ ...FORET, phase: "aller" }} instant={apres(61)} />);
    expect(ligne()[2]).toBe("Séjour");
  });

  it("dit « Case inconnue » d'une destination encore sous le brouillard", () => {
    render(<DetailDeLExpedition expedition={{ ...FORET, destination: { q: 4, r: -5, inconnue: true, distance: 1 } }} instant={DEPART} />);
    expect(ligne().slice(0, 2)).toEqual(["Case inconnue", "1 Case de votre Foyer"]);
  });

  it("dit « Sans escorte » quand aucune Bête n'est partie", () => {
    render(<DetailDeLExpedition expedition={{ ...FORET, escorte: [], explorateurs: ["Joran"] }} instant={DEPART} />);
    expect(detail()).toMatchObject({ Explorateurs: "Joran", Escorte: "Sans escorte" });
  });

  it("ne chiffre ni son temps restant ni son retour tant que le trajet d'une escorte ne l'est pas (US-0912)", () => {
    render(<DetailDeLExpedition expedition={{ ...FORET, trajetMinutes: null }} instant={apres(30 * 24 * 60)} />);
    expect(ligne().slice(2)).toEqual(["Aller", "—"]);
    expect(detail()["Retour prévu"]).toBe("—");
  });

  it("repliable, se déplie d'un toucher pour montrer son détail, et se replie de même", async () => {
    render(<DetailDeLExpedition expedition={FORET} instant={DEPART} repliable />);
    expect(deplier().getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(deplier().getAttribute("aria-controls")!)?.tagName).toBe("DL");
    // Un lecteur d'écran entend aussi de quelle Expédition il s'agit.
    expect(document.getElementById(deplier().getAttribute("aria-describedby")!)?.textContent).toContain("Forêt");
    await userEvent.click(deplier());
    expect(deplier().getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(deplier());
    expect(deplier().getAttribute("aria-expanded")).toBe("false");
  });

  it("sans être repliable, montre tout, sans rien à déplier", () => {
    render(<DetailDeLExpedition expedition={FORET} instant={DEPART} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
