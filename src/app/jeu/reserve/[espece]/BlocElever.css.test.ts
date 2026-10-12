import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du bloc « Élever », lue telle qu'elle est écrite. */
const ELEVER = readFileSync(join(process.cwd(), "src/app/jeu/reserve/[espece]/BlocElever.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte`. */
const regle = (selecteur: string, texte: string) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,="]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("choisir la quantité au pouce (US-0813)", () => {
  it("donne à « − », « + » et « Max » leur surface de 44 px, et un contour au clavier", () => {
    expect(regle(".pas", ELEVER)).toMatch(/width: 44px;[^}]*height: 44px;/);
    expect(regle(".pas", ELEVER)).toContain("cursor: pointer;");
    expect(regle(".max", ELEVER)).toContain("min-width: 44px;");
    expect(ELEVER).toMatch(/\.pas:focus-visible,\n\.champ:focus-visible \{[^}]*outline: 2px solid var\(--encre\);/);
  });

  it("écrit la quantité en 16 px au moins, pour que l'iPhone ne zoome pas, sur 44 px de haut", () => {
    expect(regle(".champ", ELEVER)).toContain("font-size: 16px;");
    expect(regle(".champ", ELEVER)).toContain("height: 44px;");
  });

  it("tient sans défilement de côté : le champ cède de sa largeur, rien n'a de largeur fixe plus grande que l'écran", () => {
    expect(regle(".champ", ELEVER)).toMatch(/flex: 0 1 120px;[^}]*min-width: 0;/);
    expect(regle(".quantite", ELEVER)).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(ELEVER).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
  });

  it("dit une quantité refusée par le contour et le message, dans la couleur d'alerte", () => {
    expect(regle('.champ[aria-invalid="true"]', ELEVER)).toContain("border-color: var(--mauvais);");
    expect(regle(".refus", ELEVER)).toContain("color: var(--mauvais);");
  });
});
