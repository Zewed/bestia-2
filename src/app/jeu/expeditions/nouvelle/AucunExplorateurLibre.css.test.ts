import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du message sans explorateur libre, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/expeditions/nouvelle/AucunExplorateurLibre.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = CSS) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("aucun explorateur libre, sur un téléphone (US-0903)", () => {
  const mobile = CSS.match(/@media \(max-width: 820px\), \(max-height: 500px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("mène aux Habitants au pouce : le lien a 44 px de haut, toute la largeur sur mobile, et se voit au clavier", () => {
    expect(regle(".habitants")).toContain("min-height: 44px;");
    expect(regle(".habitants")).toContain("cursor: pointer;");
    expect(regle(".habitants", mobile)).toMatch(/display: flex;[^}]*width: 100%;/);
    expect(regle(".habitants:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });

  it("tient sans défilement de côté : rien n'y a de largeur fixe plus grande que l'écran", () => {
    expect(CSS).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
  });
});
