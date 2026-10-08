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

describe("fermer la fiche d'une Case (US-0430)", () => {
  it("a une croix de 44 px, en haut à droite de la fiche, qui se voit au clavier", () => {
    const croix = regle(".fermer");
    expect(croix).toMatch(/position: absolute;[^}]*top: 4px;[^}]*right: 4px;/);
    expect(croix).toMatch(/width: 44px;[^}]*height: 44px;/);
    expect(croix).toContain("cursor: pointer;");
    expect(regle(".fermer:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });
});
