// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
const routeur = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));

import { Ressources, type RessourceDeLaBarre } from "./Ressources";

const STOCKS: RessourceDeLaBarre[] = [
  { id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "8.000000", sources: [{ libelle: "Foyer · prairie", parHeure: "8.000000" }] },
  { id: "vegetaux", nom: "Végétaux", famille: "nourriture", quantite: "12500.400000", limite: "20000.000000", parHeure: "14.500000", sources: [{ libelle: "Foyer · prairie", parHeure: "14.500000" }] },
  { id: "bois", nom: "Bois", famille: "materiaux", quantite: "0.999999", limite: "1000.000000", parHeure: "4.000000", sources: [{ libelle: "Foyer · prairie", parHeure: "4.000000" }] },
  { id: "pierre", nom: "Pierre", famille: "materiaux", quantite: "42.000000", limite: "1000.000000", parHeure: "0.000000", sources: [] },
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
    expect(await detail("Végétaux")).toEqual(["Végétaux", "Nourriture", "12\u00a0500,4 / 20\u00a0000", "", "Foyer · prairie : +14,5/h"]);
    expect(await detail("Bois")).toEqual(["Bois", "Matériaux", "0,99 / 1\u00a0000", "", "Foyer · prairie : +4/h"]);
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

  it("signale un Stock plein par le mot « plein », pas seulement par la couleur (US-0224)", () => {
    render(<Ressources stocks={[{ ...STOCKS[2], quantite: "1000.000000" }, STOCKS[3]]} />);
    const pleins = [...document.querySelectorAll("li[data-plein]")].map((li) => li.querySelector("img")?.alt);
    expect(pleins).toEqual(["Bois"]);
    expect(screen.getByRole("button", { name: /^Bois 1\s000 plein, 4 par heure$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pierre 42,/ })).toBeTruthy();
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

  describe("les quantités qui montent page ouverte (US-0213)", () => {
    afterEach(() => {
      vi.useRealTimers();
      routeur.refresh.mockClear();
    });
    const quantites = () => [...document.querySelectorAll("button > span:first-of-type")].map((q) => q.textContent);
    // Une production d'une unité par seconde, pour voir la quantité monter à chaque battement.
    const VITE: RessourceDeLaBarre[] = [{ id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000", limite: "1000.000000", parHeure: "3600.000000", sources: [] }];

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
});

