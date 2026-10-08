import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Les styles de la carte du Monde (page.module.css), à côté de sa vérification dans le navigateur simulé (CarteDuJeu.test.tsx).
const css = readFileSync(join(process.cwd(), "src/app/jeu/carte/page.module.css"), "utf8");
/** Les déclarations d'une règle, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = css) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("les styles de la carte du Monde", () => {
  it("la font prendre à la main, sans rien sélectionner de la page en chemin (US-0420)", () => {
    expect(regle(".carte")).toContain("cursor: grab;");
    expect(regle(".carte")).toContain("user-select: none;");
    expect(regle(".carte:active")).toContain("cursor: grabbing;");
  });
});
