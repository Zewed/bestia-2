import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du bloc sans escorte, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/expeditions/nouvelle/SansEscorte.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne. */
const regle = (selecteur: string) => CSS.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("le bloc sans escorte (US-0909)", () => {
  it("se tient à l'écart des autres blocs, comme celui des explorateurs, sans largeur fixe", () => {
    expect(regle(".bloc")).toContain("margin-top: var(--ecart);");
    expect(CSS).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
  });
});
