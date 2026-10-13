// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Caracteristique, Effectif } from "./Explication";
import { EXPLICATIONS } from "./explications";

/** Trois lignes de la fiche, et l'effectif au-dessus, comme la page les pose. */
function fiche() {
  render(
    <main>
      <Effectif nombre={12} />
      <dl>
        <Caracteristique nom="Attaque">5 981</Caracteristique>
        <Caracteristique nom="Vie">14 953</Caracteristique>
        <Caracteristique nom="Charge">500</Caracteristique>
      </dl>
      <p>Ailleurs sur la page</p>
    </main>,
  );
}

const nom = (texte: string) => screen.getByRole("button", { name: texte });
/** L'explication que le nom `texte` ouvre, par son aria-controls ; null si elle n'existe pas. */
const explication = (texte: string) => document.getElementById(nom(texte).getAttribute("aria-controls") ?? "");
const ouverte = (texte: string) => nom(texte).getAttribute("aria-expanded") === "true" && !explication(texte)?.hidden;

describe("comprendre une caractéristique de la fiche d'une Espèce (US-0807)", () => {
  afterEach(cleanup);

  it("chaque nom est un bouton, fermé d'abord : son explication, déjà là pour le lecteur d'écran, ne se voit pas", () => {
    fiche();
    for (const texte of ["Effectif", "Attaque", "Vie", "Charge"]) {
      expect(nom(texte).getAttribute("aria-expanded"), texte).toBe("false");
      expect(explication(texte)?.hidden, texte).toBe(true);
    }
    expect(screen.getByText("5 981")).toBeTruthy();
  });

  it("toucher le nom affiche son explication d'une phrase, à côté de sa valeur", async () => {
    fiche();
    await userEvent.click(nom("Charge"));
    expect(ouverte("Charge")).toBe(true);
    expect(explication("Charge")?.textContent).toContain(EXPLICATIONS.Charge);
    // Dans la liste, juste après la valeur de la ligne.
    expect(explication("Charge")?.tagName).toBe("DD");
    expect(explication("Charge")?.previousElementSibling?.textContent).toBe("500");
  });

  it("se ferme d'un bouton, et le regard revient au nom", async () => {
    fiche();
    await userEvent.click(nom("Attaque"));
    await userEvent.click(screen.getByRole("button", { name: "Fermer l'explication" }));
    expect(ouverte("Attaque")).toBe(false);
    expect(document.activeElement).toBe(nom("Attaque"));
  });

  it("se ferme d'un toucher ailleurs, mais pas d'un toucher sur l'explication elle-même", async () => {
    fiche();
    await userEvent.click(nom("Vie"));
    await userEvent.click(explication("Vie")!);
    expect(ouverte("Vie")).toBe(true);
    await userEvent.click(screen.getByText("Ailleurs sur la page"));
    expect(ouverte("Vie")).toBe(false);
  });

  it("se ferme d'Échap, le regard revenu au nom ; un second toucher du nom la referme aussi", async () => {
    fiche();
    await userEvent.click(nom("Attaque"));
    await userEvent.keyboard("{Escape}");
    expect(ouverte("Attaque")).toBe(false);
    expect(document.activeElement).toBe(nom("Attaque"));
    await userEvent.click(nom("Attaque"));
    await userEvent.click(nom("Attaque"));
    expect(ouverte("Attaque")).toBe(false);
  });

  it("une explication à la fois : en ouvrir une autre ferme la première", async () => {
    fiche();
    await userEvent.click(nom("Attaque"));
    await userEvent.click(nom("Vie"));
    expect([ouverte("Attaque"), ouverte("Vie")]).toEqual([false, true]);
  });

  it("au clavier : Tab mène au nom, Entrée ouvre, Tab mène au bouton qui ferme", async () => {
    fiche();
    await userEvent.tab();
    expect(document.activeElement).toBe(nom("Effectif"));
    await userEvent.keyboard("{Enter}");
    expect(ouverte("Effectif")).toBe(true);
    expect(explication("Effectif")?.textContent).toContain(EXPLICATIONS.Effectif);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer l'explication" }));
    await userEvent.keyboard("{Enter}");
    expect(ouverte("Effectif")).toBe(false);
  });

  it("l'effectif garde son nombre à côté de son nom", () => {
    fiche();
    expect(nom("Effectif").closest("p")?.textContent).toBe("Effectif 12");
  });
});
