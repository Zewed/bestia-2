// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CompteurHabitants } from "./CompteurHabitants";

describe("compteur d'Habitants dans la barre du haut (US-0304)", () => {
  afterEach(cleanup);

  it("montre l'icône des Habitants puis leur nombre", () => {
    render(<CompteurHabitants nombre={3} />);
    const lien = screen.getByRole("link");
    expect([...lien.children].map((enfant) => enfant.tagName)).toEqual(["IMG", "SPAN"]);
    expect(lien.querySelector("span")?.textContent).toBe("3");
    const icone = screen.getByRole("img", { name: "Habitants" });
    expect(icone.getAttribute("src")).toContain("icones%2Fhabitants.webp");
    expect([icone.getAttribute("width"), icone.getAttribute("height")]).toEqual(["22", "22"]);
  });

  it("ouvre la page Habitants, sous un nom clair : « 3 Habitants »", () => {
    render(<CompteurHabitants nombre={3} />);
    expect(screen.getByRole("link", { name: "3 Habitants" }).getAttribute("href")).toBe("/jeu/habitants");
  });

  it("accorde le nom : « 1 Habitant », « 0 Habitant »", () => {
    render(<CompteurHabitants nombre={1} />);
    expect(screen.getByRole("link", { name: "1 Habitant" })).toBeTruthy();
    cleanup();
    render(<CompteurHabitants nombre={0} />);
    expect(screen.getByRole("link", { name: "0 Habitant" })).toBeTruthy();
  });

  it("écrit un grand nombre comme les quantités de la barre", () => {
    render(<CompteurHabitants nombre={1250} />);
    expect(screen.getByRole("link").querySelector("span")?.textContent).toBe("1 250");
  });

  it("n'a pas de bulle de détail : la page Habitants en tient lieu", () => {
    render(<CompteurHabitants nombre={3} />);
    expect(document.querySelector("[aria-hidden]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
