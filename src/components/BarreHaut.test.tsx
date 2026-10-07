import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarreHaut } from "./BarreHaut";

describe("barre du haut", () => {
  it("est l'en-tête de la page", () => {
    expect(renderToStaticMarkup(<BarreHaut />)).toMatch(/^<header[^>]*>/);
  });

  it("sans actions, n'affiche que le nom du jeu", () => {
    const text = renderToStaticMarkup(<BarreHaut />).replace(/<[^>]*>/g, "");
    expect(text).toBe("Bestia");
  });

  it("montre à droite les actions que la page lui donne", () => {
    const html = renderToStaticMarkup(<BarreHaut actions={<button type="button">Ourse</button>} />);
    expect(html).toMatch(/Bestia.*<button type="button">Ourse<\/button><\/header>$/);
  });

  it("sur mobile, pose la navigation en onglets en bas de l'écran, et la page s'arrête au-dessus (US-0302)", () => {
    const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
    const formes = lire("src/styles/formes.css");
    expect(formes).toContain("--hauteur-utile: calc(100dvh - var(--hauteur-barre) - var(--hauteur-onglets) - var(--bord-bas));");
    expect(formes).toMatch(/@media \(max-width: 820px\) \{[^@]*:root:has\(\[data-onglets\]\) \{\s*--hauteur-onglets: \d+px;/);
    expect(lire("src/app/globals.css")).toMatch(/body \{[^}]*padding: [^;]*calc\(var\(--hauteur-onglets\) \+ var\(--bord-bas\)\)/);
    expect(lire("src/components/BarreHaut.module.css")).toMatch(/@media \(max-width: 820px\) \{[\s\S]*\.navigation \{[^}]*position: fixed;[^}]*bottom: 0;[^}]*var\(--bord-bas\)/);
  });

  it("sur mobile, range les quatre ressources puis le compteur d'Habitants en colonnes égales : cinq sur la bande (US-0304)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    expect(mobile).toMatch(/\.ressources \{[^}]*grid-auto-columns: minmax\(0, 1fr\);[^}]*grid-auto-flow: column;/);
    expect(mobile).toMatch(/\.groupes \{[^}]*grid-column: span 4;/);
    // Le compteur, séparé des ressources du même trait que les deux groupes entre eux.
    expect(mobile).toMatch(/\.groupe \+ \.groupe,\s*\.groupes \+ \.habitants \{[^}]*background: linear-gradient/);
  });
});
