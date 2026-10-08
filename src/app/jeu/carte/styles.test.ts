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

  it("laissent la carte au doigt : glisser dessus ne fait pas défiler la page (US-0421)", () => {
    expect(regle(".carte")).toContain("touch-action: none;");
    // Ni bulle de menu ni loupe quand le doigt s'attarde sur la carte.
    expect(regle(".carte")).toContain("-webkit-touch-callout: none;");
  });

  it("montrent la carte sélectionnée au clavier d'un contour d'Encre, tracé dedans : la page coupe ce qui dépasse (US-0422)", () => {
    expect(regle(".carte:focus-visible")).toContain("outline: 2px solid var(--encre);");
    expect(regle(".carte:focus-visible")).toContain("outline-offset: -2px;");
  });
});
