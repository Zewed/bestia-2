// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Ressources } from "./Ressources";

const STOCKS = [
  { id: "viande", nom: "Viande", famille: "nourriture", quantite: "100.000000" },
  { id: "vegetaux", nom: "Végétaux", famille: "nourriture", quantite: "12500.400000" },
  { id: "bois", nom: "Bois", famille: "materiaux", quantite: "0.999999" },
  { id: "pierre", nom: "Pierre", famille: "materiaux", quantite: "42.000000" },
] as const satisfies Parameters<typeof Ressources>[0]["stocks"];

describe("ressources dans la barre du haut (US-0204)", () => {
  afterEach(cleanup);

  const ouvertes = () => [...document.querySelectorAll("li[data-ouverte]")].map((li) => li.querySelector("img")?.getAttribute("alt"));

  it("montre l'icône de chaque ressource, son nom pour texte, puis la quantité", () => {
    render(<Ressources stocks={[...STOCKS]} />);
    const boutons = screen.getAllByRole("button");
    expect(boutons.map((b) => b.textContent?.trim())).toEqual(["100", "12\u00a0500", "0", "42"]);
    expect(screen.getAllByRole("img").map((i) => i.getAttribute("alt"))).toEqual(["Viande", "Végétaux", "Bois", "Pierre"]);
    expect(screen.getByRole("img", { name: "Bois" }).getAttribute("src")).toContain("ressources%2Fbois.webp");
    expect(screen.getByRole("button", { name: "Pierre 42" })).toBeTruthy();
    expect(ouvertes()).toEqual([]);
  });

  it("montre le nom dans une bulle au toucher, une seule à la fois, et la referme d'un second toucher", async () => {
    const u = userEvent.setup();
    render(<Ressources stocks={[...STOCKS]} />);
    await u.click(screen.getByRole("button", { name: /^Bois/ }));
    expect(ouvertes()).toEqual(["Bois"]);
    expect(document.querySelector("li[data-ouverte] [aria-hidden]")?.textContent).toBe("BoisMatériaux");
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
    const bulle = document.querySelector("li[data-ouverte] [aria-hidden]")!;
    expect(bulle.firstChild?.textContent).toBe("Végétaux");
    expect(bulle.lastChild?.textContent).toBe("Nourriture");
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
});
