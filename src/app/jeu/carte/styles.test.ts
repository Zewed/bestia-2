import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Les styles de la carte du Monde (page.module.css) et de ses boutons de zoom (BoutonsDeZoom.module.css), à côté de
// leur vérification dans le navigateur simulé (CarteDuJeu.test.tsx, BoutonsDeZoom.test.tsx).
const lire = (fichier: string) => readFileSync(join(process.cwd(), "src/app/jeu/carte", fichier), "utf8");
const css = lire("page.module.css");
const zoom = lire("BoutonsDeZoom.module.css");
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

  it("posent « + » et « − » l'un sur l'autre en bas à droite de la carte, au pouce sur mobile, au-dessus des onglets (US-0425)", () => {
    // La carte et ses boutons dans toute la place de la page ; les boutons par-dessus la carte.
    expect(regle(".cadre")).toContain("position: relative;");
    expect(regle(".cadre")).toContain("height: 100%;");
    const boutons = regle(".zoom", zoom);
    expect(boutons).toContain("position: absolute;");
    expect(boutons).toMatch(/right: calc\(\d+px \+ var\(--bord-droit\)\);/);
    expect(boutons).toMatch(/bottom: \d+px;/);
    expect(boutons).toContain("flex-direction: column;");
    expect(Number(boutons.match(/gap: (\d+)px;/)?.[1])).toBeGreaterThanOrEqual(8);
    const bouton = regle(".bouton", zoom);
    expect(bouton).toContain("width: 44px;");
    expect(bouton).toContain("height: 44px;");
    expect(bouton).toContain("cursor: pointer;");
    expect(bouton).toContain("font: inherit;");
    const grise = regle(".bouton:disabled", zoom);
    expect(grise).toContain("color: var(--galet);");
    expect(grise).toContain("cursor: default;");
    expect(regle(".bouton:focus-visible", zoom)).toContain("outline: 2px solid var(--encre);");
  });
});
