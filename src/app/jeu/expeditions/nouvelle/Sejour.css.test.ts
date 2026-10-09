import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du bloc Séjour, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/expeditions/nouvelle/Sejour.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = CSS) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,"=]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("le séjour sur un téléphone (US-0906)", () => {
  it("se choisit d'un doigt : chaque durée toute prête a 44 px de haut, la choisie pressée à l'Encre, et se voit au clavier", () => {
    expect(regle(".pret")).toContain("min-height: 44px;");
    expect(regle(".pret")).toContain("cursor: pointer;");
    expect(regle('.pret[aria-pressed="true"]')).toContain("background: var(--encre);");
    expect(regle(".pret:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });

  it("au curseur aussi : toute la largeur, 44 px de haut", () => {
    expect(regle(".curseur")).toMatch(/width: 100%;[^}]*height: 44px;/);
    expect(regle(".curseur")).toContain("cursor: pointer;");
    expect(regle(".curseur:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });

  it("tient sans défilement de côté : les quatre durées prêtes se partagent la largeur, rien n'a de largeur fixe", () => {
    expect(regle(".prets")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(CSS).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
  });
});
