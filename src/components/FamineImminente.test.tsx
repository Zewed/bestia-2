// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// US-0326 : le routeur, observé pour voir la page se relire à chaque départ d'un Habitant.
const routeur = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));

import { FamineImminente } from "./FamineImminente";

const HEURE = 3_600_000;
/** Une espace insécable entre un nombre et son unité. */
const _ = " ";

afterEach(() => {
  cleanup();
  routeur.refresh.mockClear();
  vi.useRealTimers();
});

/** L'avertissement, s'il est là. */
const avertissement = () => document.querySelector<HTMLAnchorElement>("[data-alerte-famine]");
/** Ce qu'il dit, morceau par morceau. */
const morceaux = () => [...(avertissement()?.children ?? [])].map((morceau) => morceau.textContent);

describe("l'avertissement « famine imminente » (US-0321)", () => {
  it("paraît quand la Nourriture ne couvre plus que 12 heures d'Entretien : « Famine imminente », le temps qui reste, et « Voir »", () => {
    render(<FamineImminente heures={7.5} />);
    expect(morceaux()).toEqual(["Famine imminente depuis un instant", `Nourriture pour encore 7${_}h`, "Voir"]);
  });

  it("mène à la page Habitants, toute la bande étant le lien", () => {
    render(<FamineImminente heures={7.5} />);
    const lien = screen.getByRole("link", { name: `Famine imminente depuis un instant Nourriture pour encore 7${_}h Voir` });
    expect(lien.getAttribute("href")).toBe("/jeu/habitants");
    expect(lien).toBe(avertissement());
  });

  it("paraît à 12 heures tout juste, mais pas au-dessus", () => {
    render(<FamineImminente heures={12} />);
    expect(morceaux()[1]).toBe(`Nourriture pour encore 12${_}h`);
    cleanup();
    render(<FamineImminente heures={12.5} />);
    expect(avertissement()).toBeNull();
    expect(document.body.textContent).toBe("");
  });

  it("dit « moins d'une heure » quand la Nourriture est presque épuisée, jusqu'à la Famine (US-0325)", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={0.5} />);
    expect(morceaux()[1]).toBe("Nourriture pour encore moins d'une heure");
    await act(async () => vi.advanceTimersByTime(HEURE / 2 - 1_000));
    expect(morceaux()[1]).toBe("Nourriture pour encore moins d'une heure");
  });

  it("fait baisser le temps qui reste en direct, au rythme du jeu", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={7.5} />);
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(morceaux()[1]).toBe(`Nourriture pour encore 6${_}h`);
    cleanup();
    render(<FamineImminente heures={7.5} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(HEURE / 100));
    expect(morceaux()[1]).toBe(`Nourriture pour encore 6${_}h`);
  });

  it("paraît page ouverte, quand la Nourriture passe sous le seuil", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={13} />);
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(HEURE - 1_000));
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(morceaux()).toEqual(["Famine imminente depuis un instant", `Nourriture pour encore 12${_}h`, "Voir"]);
  });

  it("paraît exactement au moment prévu en vitesse accélérée, entre deux battements de la seconde", async () => {
    vi.useFakeTimers();
    // 12 h 00 min 36 s de Nourriture, au temps ×100 : sous le seuil au bout de 360 ms réelles.
    render(<FamineImminente heures={12.01} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(359));
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1));
    expect(avertissement()).not.toBeNull();
  });
});

describe("trouver l'avertissement en revenant (US-0322)", () => {
  it("paraît dès l'ouverture quand le seuil a été franchi pendant l'absence, et dit depuis quand", () => {
    render(<FamineImminente heures={7.5} depuis={3.2} />);
    expect(morceaux()).toEqual([`Famine imminente depuis 3${_}h`, `Nourriture pour encore 7${_}h`, "Voir"]);
    expect(screen.getByRole("link", { name: `Famine imminente depuis 3${_}h Nourriture pour encore 7${_}h Voir` })).toBe(avertissement());
  });

  it("garde « Famine imminente » en gras, le « depuis » à côté", () => {
    render(<FamineImminente heures={7.5} depuis={3.2} />);
    expect(avertissement()?.querySelector("strong")?.textContent).toBe("Famine imminente");
  });

  it("fait monter le « depuis » en direct, au rythme du jeu, comme baisse le temps qui reste", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={7.5} depuis={0.99} />);
    expect(morceaux()[0]).toBe(`Famine imminente depuis 59${_}min`);
    await act(async () => vi.advanceTimersByTime(36_000));
    expect(morceaux()[0]).toBe(`Famine imminente depuis 1${_}h`);
    cleanup();
    render(<FamineImminente heures={7.5} depuis={2.5} vitesse={100} />);
    expect(morceaux()[0]).toBe(`Famine imminente depuis 2${_}h`);
    await act(async () => vi.advanceTimersByTime(HEURE / 100));
    expect(morceaux()).toEqual([`Famine imminente depuis 3${_}h`, `Nourriture pour encore 6${_}h`, "Voir"]);
  });

  it("page ouverte, compte depuis l'instant où la Nourriture passe le seuil", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={12.5} depuis={null} />);
    await act(async () => vi.advanceTimersByTime(HEURE / 2));
    expect(morceaux()[0]).toBe("Famine imminente depuis un instant");
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(morceaux()[0]).toBe(`Famine imminente depuis 1${_}min`);
  });

  it("n'envoie rien hors de la page : aucune notification du navigateur", async () => {
    vi.useFakeTimers();
    const notification = Object.assign(vi.fn(), { permission: "granted", requestPermission: vi.fn() });
    vi.stubGlobal("Notification", notification);
    try {
      render(<FamineImminente heures={12.5} depuis={null} />);
      await act(async () => vi.advanceTimersByTime(HEURE));
      expect(avertissement()).not.toBeNull();
      expect(notification).not.toHaveBeenCalled();
      expect(notification.requestPermission).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("retirer l'avertissement quand le danger est passé (US-0323)", () => {
  it("reste là entre 12 et 13 heures de Nourriture, tant que le Territoire retient la famine imminente", () => {
    render(<FamineImminente heures={12.9} depuis={2} />);
    expect(morceaux()).toEqual([`Famine imminente depuis 2${_}h`, `Nourriture pour encore 12${_}h`, "Voir"]);
  });

  it("ne paraît pas entre 12 et 13 heures si le Territoire ne la retient pas : la marge ne sert qu'à la garder", () => {
    render(<FamineImminente heures={12.9} depuis={null} />);
    expect(avertissement()).toBeNull();
  });

  it("disparaît quand la Nourriture couvre plus de 13 heures, puis reparaît au seuil, depuis ce nouvel instant", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={13.5} depuis={2} />);
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1.5 * HEURE - 1_000));
    expect(avertissement()).toBeNull();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(morceaux()).toEqual(["Famine imminente depuis un instant", `Nourriture pour encore 12${_}h`, "Voir"]);
  });

  it("ne peut pas être masqué : aucun bouton, la bande n'est qu'un lien vers la page Habitants", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={7.5} depuis={3} />);
    expect(screen.queryAllByRole("button")).toEqual([]);
    expect(screen.getAllByRole("link")).toEqual([avertissement()]);
    expect(document.body.textContent).not.toMatch(/masquer|fermer|ignorer|×/i);
    // Rien de ce qu'on touche ne la retire : elle mène ailleurs, et revient sur chaque page.
    await act(async () => avertissement()!.click());
    expect(avertissement()).not.toBeNull();
  });
});

describe("entrer en Famine (US-0325)", () => {
  it("dit « Famine » à la place de « famine imminente », depuis quand, et « Voir », au même endroit et vers la même page", () => {
    render(<FamineImminente heures={0} depuis={14} famine={2.4} />);
    expect(morceaux()).toEqual([`Famine depuis 2${_}h`, "Voir"]);
    expect(avertissement()?.querySelector("strong")?.textContent).toBe("Famine");
    expect(screen.getByRole("link", { name: `Famine depuis 2${_}h Voir` }).getAttribute("href")).toBe("/jeu/habitants");
  });

  it("est plus marquée que la famine imminente", () => {
    render(<FamineImminente heures={0} famine={2} />);
    expect(avertissement()?.hasAttribute("data-famine")).toBe(true);
    cleanup();
    render(<FamineImminente heures={7} depuis={3} />);
    expect(avertissement()?.hasAttribute("data-famine")).toBe(false);
  });

  it("fait monter le « depuis » en direct, au rythme du jeu", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={0} famine={2.5} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(HEURE / 100));
    expect(morceaux()).toEqual([`Famine depuis 3${_}h`, "Voir"]);
  });

  it("page ouverte, laisse « famine imminente » à « Famine » à l'instant où la Nourriture ne paie plus l'Entretien", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={2} depuis={10} />);
    await act(async () => vi.advanceTimersByTime(2 * HEURE - 1_000));
    expect(morceaux()).toEqual([`Famine imminente depuis 11${_}h`, "Nourriture pour encore moins d'une heure", "Voir"]);
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(morceaux()).toEqual(["Famine depuis un instant", "Voir"]);
    expect(avertissement()?.hasAttribute("data-famine")).toBe(true);
    await act(async () => vi.advanceTimersByTime(HEURE));
    expect(morceaux()[0]).toBe(`Famine depuis 1${_}h`);
  });

  it("bascule exactement au moment prévu en vitesse accélérée, entre deux battements de la seconde", async () => {
    vi.useFakeTimers();
    // 36 secondes de Nourriture, au temps ×100 : la Famine commence au bout de 360 ms réelles.
    render(<FamineImminente heures={0.01} depuis={11.99} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(359));
    expect(morceaux()[0]).toBe(`Famine imminente depuis 11${_}h`);
    await act(async () => vi.advanceTimersByTime(1));
    expect(morceaux()).toEqual(["Famine depuis un instant", "Voir"]);
  });

  it("dit « Famine » dès l'ouverture quand la Nourriture ne paie déjà plus l'Entretien, sans rien de retenu", () => {
    render(<FamineImminente heures={0} />);
    expect(morceaux()).toEqual(["Famine depuis un instant", "Voir"]);
  });
});

describe("voir des Habitants s'en aller (US-0326)", () => {
  it("relit la page juste après chaque départ, une heure pleine après le début de la Famine, au rythme du jeu", async () => {
    vi.useFakeTimers();
    // Famine depuis 2 h 30 au temps ×100 : le prochain départ, à 3 h, tombe 18 secondes réelles plus tard.
    render(<FamineImminente heures={0} famine={2.5} vitesse={100} />);
    await act(async () => vi.advanceTimersByTime(18_000));
    expect(routeur.refresh).not.toHaveBeenCalled();
    // Une seconde après, le temps que le serveur l'ait fait partir.
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(routeur.refresh).toHaveBeenCalledTimes(1);
  });

  it("page ouverte, relit aussi la page au premier départ, une heure après le début de la Famine", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={0.5} depuis={11.5} />);
    await act(async () => vi.advanceTimersByTime(1.5 * HEURE));
    expect(routeur.refresh).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(routeur.refresh).toHaveBeenCalledTimes(1);
  });

  it("ne relit rien tant que la Famine n'est pas en vue", async () => {
    vi.useFakeTimers();
    render(<FamineImminente heures={7} depuis={3} />);
    await act(async () => vi.advanceTimersByTime(7 * HEURE));
    expect(routeur.refresh).not.toHaveBeenCalled();
  });
});
