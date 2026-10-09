import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Les feuilles de style du bloc Explorateurs et du départ, lues telles qu'elles sont écrites. */
const lire = (fichier: string) => readFileSync(join(process.cwd(), "src/app/jeu/expeditions/nouvelle", fichier), "utf8");
const EXPLORATEURS = lire("Explorateurs.module.css");
const PARTIR = lire("Partir.module.css");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte`. */
const regle = (selecteur: string, texte: string) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("choisir les explorateurs sur un téléphone (US-0902)", () => {
  const mobile = PARTIR.match(/@media \(max-width: 820px\), \(max-height: 500px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("se fait au pouce : « − » et « + » font 44 px de côté, et se voient au clavier", () => {
    expect(regle(".plusMoins", EXPLORATEURS)).toMatch(/width: 44px;[^}]*height: 44px;/);
    expect(regle(".plusMoins", EXPLORATEURS)).toContain("cursor: pointer;");
    expect(regle(".plusMoins:focus-visible", EXPLORATEURS)).toContain("outline: 2px solid var(--encre);");
  });

  it("part au pouce : « Partir » a 44 px de haut, toute la largeur sur mobile, et grisé ne se touche pas", () => {
    expect(regle(".partir", PARTIR)).toContain("min-height: 44px;");
    expect(regle(".partir", mobile)).toContain("width: 100%;");
    expect(regle(".partir:disabled", PARTIR)).toContain("cursor: not-allowed;");
    expect(regle(".partir:focus-visible", PARTIR)).toContain("outline: 2px solid var(--encre);");
  });

  it("tient sans défilement de côté : rien n'y a de largeur fixe plus grande que l'écran, à l'écart des autres blocs", () => {
    for (const css of [EXPLORATEURS, PARTIR]) expect(css).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
    expect(regle(".lignes > div", EXPLORATEURS)).toContain("grid-template-columns: 96px minmax(0, 1fr);");
    expect(regle(".bloc", EXPLORATEURS)).toContain("margin-top: var(--ecart);");
    expect(regle(".depart", PARTIR)).toContain("margin-top: var(--ecart);");
  });
});
