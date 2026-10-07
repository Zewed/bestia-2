// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
const routeur = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));

import { quantiteMontee, Ressources, type RessourceDeLaBarre } from "./Ressources";

const STOCKS: RessourceDeLaBarre[] = [
  { id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "8.000000", entretienParHeure: "0.000000", sources: [{ libelle: "Foyer · prairie", parHeure: "8.000000" }] },
  { id: "vegetaux", nom: "Végétaux", famille: "nourriture", quantite: "12500.400000", limite: "20000.000000", parHeure: "14.500000", entretienParHeure: "0.000000", sources: [{ libelle: "Foyer · prairie", parHeure: "14.500000" }] },
  { id: "bois", nom: "Bois", famille: "materiaux", quantite: "0.999999", limite: "1000.000000", parHeure: "4.000000", entretienParHeure: "0.000000", sources: [{ libelle: "Foyer · prairie", parHeure: "4.000000" }] },
  { id: "pierre", nom: "Pierre", famille: "materiaux", quantite: "42.000000", limite: "1000.000000", parHeure: "0.000000", entretienParHeure: "0.000000", sources: [] },
];

describe("ressources dans la barre du haut (US-0204)", () => {
  afterEach(cleanup);

  const ouvertes = () => [...document.querySelectorAll("li[data-ouverte]")].map((li) => li.querySelector("img")?.getAttribute("alt"));

  it("montre l'icône de chaque ressource, son nom pour texte, puis la quantité", () => {
    render(<Ressources stocks={[...STOCKS]} />);
    const boutons = screen.getAllByRole("button");
    expect(boutons.map((b) => b.querySelector("span")?.textContent)).toEqual(["100", "12\u00a0500", "0", "42"]);
    expect(screen.getAllByRole("img").map((i) => i.getAttribute("alt"))).toEqual(["Viande", "Végétaux", "Bois", "Pierre"]);
    expect(screen.getByRole("img", { name: "Bois" }).getAttribute("src")).toContain("ressources%2Fbois.webp");
    expect(screen.getByRole("button", { name: "Pierre 42, 0 par heure" })).toBeTruthy();
    expect(ouvertes()).toEqual([]);
  });

  it("montre la production horaire de chaque ressource, plus discrète quand elle est nulle (US-0212)", () => {
    render(<Ressources stocks={[...STOCKS]} />);
    const productions = screen.getAllByRole("button").map((b) => b.querySelector("[aria-hidden]")?.textContent);
    expect(productions).toEqual(["+8/h", "+14,5/h", "+4/h", "+0/h"]);
    expect([...document.querySelectorAll("[data-nulle]")].map((e) => e.closest("li")?.querySelector("img")?.alt)).toEqual(["Pierre"]);
    expect(screen.getByRole("button", { name: "Végétaux 12\u00a0500, 14,5 par heure" })).toBeTruthy();
  });

  it("montre le nom dans une bulle au toucher, une seule à la fois, et la referme d'un second toucher", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[...STOCKS]} />);
    await u.click(screen.getByRole("button", { name: /^Bois/ }));
    expect(ouvertes()).toEqual(["Bois"]);
    expect(document.querySelector("li[data-ouverte] > [aria-hidden]")?.firstChild?.textContent).toBe("Bois");
    await u.click(screen.getByRole("button", { name: /^Viande/ }));
    expect(ouvertes()).toEqual(["Viande"]);
    await u.click(screen.getByRole("button", { name: /^Viande/ }));
    expect(ouvertes()).toEqual([]);
  });

  it("range la Viande et les Végétaux en Nourriture, le Bois et la Pierre en Matériaux (US-0205)", () => {
    render(<Ressources stocks={[...STOCKS]} />);
    const groupes = screen.getAllByRole("list").map((liste) => [liste.getAttribute("aria-label"), [...liste.querySelectorAll("img")].map((i) => i.alt)]);
    expect(groupes).toEqual([
      ["Nourriture", ["Viande", "Végétaux"]],
      ["Matériaux", ["Bois", "Pierre"]],
    ]);
    expect(screen.getByRole("group", { name: "Ressources" })).toBeTruthy();
  });

  it("dit le groupe de la ressource dans la bulle, sous son nom (US-0205)", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[...STOCKS]} />);
    await u.click(screen.getByRole("button", { name: /^Végétaux/ }));
    const bulle = document.querySelector("li[data-ouverte] > [aria-hidden]")!;
    expect(bulle.children[0].textContent).toBe("Végétaux");
    expect(bulle.children[1].textContent).toBe("Nourriture");
  });

  it("détaille la ressource : sa quantité exacte au centième et la source de sa production (US-0214)", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={STOCKS} />);
    const detail = async (nom: string) => {
      await u.click(screen.getByRole("button", { name: new RegExp(`^${nom}`) }));
      return [...document.querySelector("li[data-ouverte] > [aria-hidden]")!.children].map((ligne) => ligne.textContent);
    };
    expect(await detail("Végétaux")).toEqual(["Végétaux", "Nourriture", "12\u00a0500,4 / 20\u00a0000", "", "plein dans 21 j 13 h", "Foyer · prairie : +14,5/h"]);
    expect(await detail("Bois")).toEqual(["Bois", "Matériaux", "0,99 / 1\u00a0000", "", "plein dans 10 j 9 h", "Foyer · prairie : +4/h"]);
    expect(await detail("Pierre")).toEqual(["Pierre", "Matériaux", "42 / 1\u00a0000", "", "+0/h"]);
  });

  it("montre la limite du Stock et une jauge de remplissage (US-0223)", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[{ ...STOCKS[2], quantite: "250.000000" }]} />);
    await u.click(screen.getByRole("button", { name: /^Bois/ }));
    const bulle = document.querySelector("li[data-ouverte] > [aria-hidden]")!;
    expect(bulle.children[2].textContent).toBe("250 / 1\u00a0000");
    expect((bulle.children[3].firstElementChild as HTMLElement).style.width).toBe("25%");
  });

  it("dit dans combien de temps un Stock sera plein, au rythme du jeu, et rien pour un Stock qui ne produit pas (US-0226)", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[{ ...STOCKS[2], quantite: "986.666667" }, STOCKS[3]]} vitesse={2} />);
    const detail = async (nom: string) => {
      await u.click(screen.getByRole("button", { name: new RegExp(`^${nom}`) }));
      return [...document.querySelector("li[data-ouverte] > [aria-hidden]")!.children].map((ligne) => ligne.textContent);
    };
    // 13,33 Bois à 4 par heure de jeu, le jeu allant deux fois plus vite : 1 h 40.
    expect(await detail("Bois")).toContain("plein dans 1 h 40");
    expect((await detail("Pierre")).some((ligne) => ligne?.startsWith("plein dans"))).toBe(false);
  });

  it("compte le temps avant d'être plein au rythme net, Entretien payé, et ne promet rien à un Stock qui ne monte plus (US-0316)", async () => {
    const u = userEvent.setup();
    render(
      <Ressources
        stocks={[
          { ...STOCKS[0], quantite: "986.666667", parHeure: "4.000000", entretienParHeure: "2.000000" },
          { ...STOCKS[1], entretienParHeure: "14.500000" },
        ]}
        vitesse={2}
      />,
    );
    const detail = async (nom: string) => {
      await u.click(screen.getByRole("button", { name: new RegExp(`^${nom}`) }));
      return [...document.querySelector("li[data-ouverte] > [aria-hidden]")!.children].map((ligne) => ligne.textContent);
    };
    // 13,33 Viande à 4 - 2 par heure de jeu, le jeu allant deux fois plus vite : 3 h 20.
    expect(await detail("Viande")).toContain("plein dans 3 h 20");
    // Les Végétaux produisent autant qu'on en mange : la source reste dite, sans promesse.
    expect(await detail("Végétaux")).toEqual(["Végétaux", "Nourriture", "12 500,4 / 20 000", "", "Foyer · prairie : +14,5/h"]);
  });

  it("prévient d'un Stock presque plein, à partir de 90 % de sa limite, autrement que d'un Stock plein (US-0227)", () => {
    render(<Ressources stocks={[{ ...STOCKS[0], quantite: "899.000000" }, { ...STOCKS[2], quantite: "900.000000" }, { ...STOCKS[3], quantite: "1000.000000" }]} />);
    const etat = (nom: string) => {
      const li = [...document.querySelectorAll("li")].find((l) => l.querySelector("img")?.alt === nom)!;
      return [li.hasAttribute("data-presque-plein"), li.hasAttribute("data-plein")];
    };
    expect(etat("Viande")).toEqual([false, false]);
    expect(etat("Bois")).toEqual([true, false]);
    expect(etat("Pierre")).toEqual([false, true]);
    expect(screen.getByRole("button", { name: /^Bois 900, presque plein/ })).toBeTruthy();
  });

  it("signale un Stock plein par le mot « plein », pas seulement par la couleur (US-0224)", () => {
    render(<Ressources stocks={[{ ...STOCKS[2], quantite: "1000.000000" }, STOCKS[3]]} />);
    const pleins = [...document.querySelectorAll("li[data-plein]")].map((li) => li.querySelector("img")?.alt);
    expect(pleins).toEqual(["Bois"]);
    expect(screen.getByRole("button", { name: /^Bois 1\s000 plein, production perdue$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pierre 42,/ })).toBeTruthy();
  });

  it("dit qu'un Stock plein perd sa production, et à quel rythme elle reprendra (US-0225)", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[{ ...STOCKS[2], quantite: "1000.000000" }]} />);
    const bouton = screen.getByRole("button", { name: /^Bois/ });
    expect(bouton.querySelector("[aria-hidden]")).toBeNull(); // plus de « +4/h » : « PLEIN » en tient lieu
    await u.click(bouton);
    const lignes = [...document.querySelector("li[data-ouverte] > [aria-hidden]")!.children].map((l) => l.textContent);
    expect(lignes).toEqual([
      "Bois",
      "Matériaux",
      "1\u00a0000 / 1\u00a0000",
      "",
      "Stock plein : la production de Bois est perdue.",
      "Elle reprendra à +4/h dès qu'il y aura de la place.",
    ]);
  });

  it("referme la bulle d'un toucher ailleurs ou avec Échap", async () => {
    const u = userEvent.setup();
    render(
      <>
        <Ressources stocks={[...STOCKS]} />
        <p>ailleurs</p>
      </>,
    );
    await u.click(screen.getByRole("button", { name: /^Pierre/ }));
    await u.click(screen.getByText("ailleurs"));
    expect(ouvertes()).toEqual([]);
    await u.click(screen.getByRole("button", { name: /^Pierre/ }));
    await u.keyboard("{Escape}");
    expect(ouvertes()).toEqual([]);
  });

  it("pose ce qui suit les ressources dans la même bande, après elles et hors de leur groupe (US-0304)", async () => {
    const u = userEvent.setup();
    render(
      <Ressources stocks={[...STOCKS]}>
        <a href="#habitants">3 Habitants</a>
      </Ressources>,
    );
    const bande = document.querySelector("[data-bande-ressources]")!;
    const groupe = screen.getByRole("group", { name: "Ressources" });
    const lien = screen.getByRole("link", { name: "3 Habitants" });
    expect([...bande.children]).toEqual([groupe, lien]);
    // Toucher le compteur referme la bulle ouverte, comme tout autre toucher hors des ressources.
    await u.click(screen.getByRole("button", { name: /^Bois/ }));
    expect(ouvertes()).toEqual(["Bois"]);
    lien.addEventListener("click", (evenement) => evenement.preventDefault());
    await u.click(lien);
    expect(ouvertes()).toEqual([]);
  });

  describe("les quantités qui montent page ouverte (US-0213)", () => {
    afterEach(() => {
      vi.useRealTimers();
      routeur.refresh.mockClear();
    });
    const quantites = () => [...document.querySelectorAll("button > span:first-of-type")].map((q) => q.textContent);
    // Une production d'une unité par seconde, pour voir la quantité monter à chaque battement.
    const VITE: RessourceDeLaBarre[] = [{ id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "3600.000000", entretienParHeure: "0.000000", sources: [] }];

    it("montrent d'abord les quantités exactes du jeu, puis montent d'elles-mêmes au rythme de la production", async () => {
      vi.useFakeTimers();
      render(<Ressources stocks={[...VITE]} />);
      expect(quantites()).toEqual(["100"]);
      await act(async () => vi.advanceTimersByTime(5_000));
      expect(quantites()).toEqual(["105"]);
    });

    it("s'arrêtent à la limite, et ne montent pas au-dessus (US-0221), où le Stock se dit plein (US-0224)", async () => {
      vi.useFakeTimers();
      render(<Ressources stocks={[{ ...VITE[0], quantite: "998.000000" }]} />);
      expect(document.querySelector("li[data-plein]")).toBeNull();
      await act(async () => vi.advanceTimersByTime(10_000));
      expect(quantites()).toEqual(["1\u00a0000"]);
      expect(document.querySelector("li[data-plein]")).not.toBeNull();
    });

    it("montent plus vite quand le temps du jeu est accéléré", async () => {
      vi.useFakeTimers();
      render(<Ressources stocks={[...VITE]} vitesse={10} />);
      await act(async () => vi.advanceTimersByTime(3_000));
      expect(quantites()).toEqual(["130"]);
    });

    it("descendent au rythme net quand l'Entretien dépasse la production, sans passer sous zéro (US-0316)", async () => {
      vi.useFakeTimers();
      // Trois unités mangées par seconde pour une produite : deux de moins à chaque seconde.
      render(<Ressources stocks={[{ ...VITE[0], quantite: "5.000000", entretienParHeure: "10800.000000" }]} />);
      await act(async () => vi.advanceTimersByTime(2_000));
      expect(quantites()).toEqual(["1"]);
      await act(async () => vi.advanceTimersByTime(3_000));
      expect(quantites()).toEqual(["0"]);
    });

    it("font descendre jusqu'à sa limite, sans production, un Stock au-dessus d'elle que les Habitants mangent (US-0230, US-0316)", () => {
      const surplus = { ...VITE[0], quantite: "1010.000000", parHeure: "8.000000", entretienParHeure: "10.000000" };
      expect(quantiteMontee(surplus, 0.5 * 3_600_000, 1)).toBe(1005);
      // Une heure pour revenir à sa limite, puis une heure à 8 - 10 par heure.
      expect(quantiteMontee(surplus, 2 * 3_600_000, 1)).toBe(998);
      expect(quantiteMontee(surplus, 3_600_000, 2)).toBe(998);
    });

    it("se recalent sur le jeu toutes les 5 minutes, et dès le retour sur l'onglet", async () => {
      vi.useFakeTimers();
      render(<Ressources stocks={[...VITE]} />);
      await act(async () => vi.advanceTimersByTime(5 * 60_000));
      expect(routeur.refresh).toHaveBeenCalledTimes(1);
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(routeur.refresh).toHaveBeenCalledTimes(1);
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(routeur.refresh).toHaveBeenCalledTimes(2);
    });
  });

  it("montre la vraie quantité d'un Stock au-dessus de sa limite, plein, sans la faire monter (US-0230)", async () => {
    vi.useFakeTimers();
    try {
      // Assez de production pour qu'une minute se voie, si le Stock montait.
      render(<Ressources stocks={[{ ...STOCKS[2], quantite: "1200.000000", limite: "1000.000000", parHeure: "3600.000000" }]} />);
      const montre = () => [
        document.querySelector("button > span")?.textContent,
        document.querySelector("li > [aria-hidden]")!.children[2].textContent,
        document.querySelector("li[data-plein]") !== null,
        screen.queryByRole("button", { name: /^Bois 1\s200 plein, production perdue$/ }) !== null,
      ];
      expect(montre()).toEqual(["1 200", "1 200 / 1 000", true, true]);
      await act(async () => vi.advanceTimersByTime(60_000));
      expect(montre()).toEqual(["1 200", "1 200 / 1 000", true, true]);
    } finally {
      vi.useRealTimers();
      routeur.refresh.mockClear();
    }
  });
});

