import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style de la liste des Expéditions en cours, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/expeditions/page.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = CSS) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("la liste des Expéditions en cours sur un téléphone (US-0911, US-0918)", () => {
  const mobile = CSS.match(/@media \(max-width: 820px\), \(max-height: 500px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("tient sans défilement de côté : rien n'y a de largeur fixe plus grande que l'écran", () => {
    expect(regle(".page", mobile)).toContain("padding: 12px;");
    expect(CSS).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
  });

  it("sans Expédition, met le bouton pour en préparer une au pouce : 44 px de haut, toute la largeur sur mobile", () => {
    expect(regle(".preparer")).toContain("min-height: 44px;");
    expect(regle(".preparer")).toContain("cursor: pointer;");
    expect(regle(".preparer:focus-visible")).toContain("outline: 2px solid var(--encre);");
    expect(regle(".preparer", mobile)).toMatch(/display: flex;[^}]*width: 100%;/);
  });
});
