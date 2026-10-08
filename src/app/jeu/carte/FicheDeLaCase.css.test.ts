import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style de la fiche d'une Case, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/carte/FicheDeLaCase.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = CSS) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("la fiche d'une Case à l'écran (US-0428)", () => {
  it("flotte sur ordinateur en haut à gauche de la carte, à hauteur du bouton de la légende, qui est à droite", () => {
    const fiche = regle(".fiche");
    expect(fiche).toContain("position: absolute;");
    expect(fiche).toContain("top: 12px;");
    expect(fiche).toContain("left: calc(12px + var(--bord-gauche));");
    // Un bloc Bento qui défile s'il dépasse la carte.
    expect(fiche).toMatch(/max-height: calc\(100% - 24px\);[^}]*overflow-y: auto;/);
    expect(fiche).toMatch(/border-radius: var\(--arrondi\);[^}]*background: var\(--bloc\);[^}]*box-shadow: var\(--ombre\);/);
  });
});

describe("la fiche d'une Case sur mobile (US-0431)", () => {
  const mobile = CSS.match(/@media \(max-width: 820px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("s'ouvre comme la légende dans un panneau en bas, au-dessus des onglets, sur moins de la moitié de la carte", () => {
    const fiche = regle(".fiche", mobile);
    expect(fiche).toMatch(/position: fixed;[^}]*top: auto;[^}]*right: 0;[^}]*bottom: calc\(var\(--hauteur-onglets\) \+ var\(--bord-bas\)\);[^}]*left: 0;/);
    expect(fiche).toMatch(/width: auto;[^}]*max-width: none;[^}]*max-height: calc\(0\.45 \* var\(--hauteur-utile\)\);/);
    expect(fiche).toContain("border-radius: var(--arrondi) var(--arrondi) 0 0;");
    // Elle se prend au doigt pour la faire glisser : ni la page ne défile, ni le texte ne se sélectionne.
    expect(fiche).toMatch(/touch-action: none;[^}]*user-select: none;/);
  });

  it("montre une poignée sur mobile seulement, et revient en douceur, sauf mouvement réduit", () => {
    expect(regle(".poignee")).toContain("display: none;");
    expect(regle(".poignee", mobile)).toContain("display: block;");
    expect(regle(".fiche", mobile)).toContain("transition: transform");
    expect(CSS).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\.fiche \{[^}]*transition: none;/);
  });
});

describe("fermer la fiche d'une Case (US-0430)", () => {
  it("a une croix de 44 px, en haut à droite de la fiche, qui se voit au clavier", () => {
    const croix = regle(".fermer");
    expect(croix).toMatch(/position: absolute;[^}]*top: 4px;[^}]*right: 4px;/);
    expect(croix).toMatch(/width: 44px;[^}]*height: 44px;/);
    expect(croix).toContain("cursor: pointer;");
    expect(regle(".fermer:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });
});

describe("envoyer une Expédition depuis la fiche d'une Case (US-0901)", () => {
  it("se touche au pouce : un bouton de 44 px de haut, toute la largeur de la fiche, qui se voit au clavier", () => {
    const envoyer = regle(".envoyer");
    expect(envoyer).toMatch(/display: flex;[^}]*min-height: 44px;/);
    expect(envoyer).toContain("width: 100%;");
    expect(envoyer).toContain("cursor: pointer;");
    expect(regle(".envoyer:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });
});
