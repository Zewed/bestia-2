import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du bloc Escorte, lue telle qu'elle est écrite. */
const ESCORTE = readFileSync(join(process.cwd(), "src/app/jeu/expeditions/nouvelle/Escorte.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte`. */
const regle = (selecteur: string, texte: string) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("choisir l'escorte sur un téléphone (US-0904)", () => {
  const portrait = ESCORTE.match(/@media \(max-width: 560px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("se fait au pouce : « − », « + », « Toutes » et « Aucune » ont 44 px de surface, et se voient au clavier", () => {
    expect(regle(".bouton", ESCORTE)).toMatch(/width: 44px;[^}]*height: 44px;/);
    expect(regle(".bouton", ESCORTE)).toContain("cursor: pointer;");
    expect(regle(".mot", ESCORTE)).toContain("min-width: 44px;");
    expect(regle(".bouton:focus-visible", ESCORTE)).toContain("outline: 2px solid var(--encre);");
  });

  it("tient sans défilement de côté : rien n'y a de largeur fixe plus grande que l'écran, et en portrait les choix passent sous le nom", () => {
    expect(ESCORTE).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
    expect(regle(".espece", ESCORTE)).toContain("grid-template-columns: 48px minmax(0, 1fr) auto;");
    expect(regle(".choix", ESCORTE)).toContain("flex-wrap: wrap;");
    expect(regle(".espece", portrait)).toContain("grid-template-columns: 48px minmax(0, 1fr);");
    expect(regle(".choix", portrait)).toContain("grid-column: 1 / -1;");
  });

  it("se tient à l'écart des autres blocs", () => {
    expect(regle(".bloc", ESCORTE)).toContain("margin-top: var(--ecart);");
  });
});

describe("la force de l'escorte (US-0905)", () => {
  it("se lit sous les Espèces, d'un trait, comme les lignes des autres blocs : l'étiquette, puis le total, dans la largeur qui reste", () => {
    expect(regle(".force", ESCORTE)).toContain("grid-template-columns: 96px minmax(0, 1fr);");
    expect(regle(".force", ESCORTE)).toContain("border-top: 1px solid var(--trait);");
    expect(regle(".force dt", ESCORTE)).toContain("color: var(--texte-discret);");
    expect(regle(".total", ESCORTE)).toMatch(/font-weight: var\(--graisse-titre\);[^}]*font-variant-numeric: tabular-nums;/);
  });
});
