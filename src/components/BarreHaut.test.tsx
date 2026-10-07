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

  it("sur un petit écran d'ordinateur, passe les ressources en bande sous la barre, la navigation restant en haut (US-0324)", () => {
    const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
    expect(lire("src/styles/formes.css")).toMatch(/@media \(max-width: 1279px\) \{\s*:root:has\(\[data-bande-ressources\]\) \{\s*--hauteur-bande: 44px;/);
    const css = lire("src/components/BarreHaut.module.css");
    const petit = css.slice(css.indexOf("@media (min-width: 821px) and (max-width: 1279px)"), css.indexOf("@media (max-width: 820px)"));
    expect(petit).toMatch(/\.ressources \{[^}]*grid-column: 1 \/ -1;[^}]*grid-row: 2;/);
    expect(petit).not.toMatch(/\.navigation/);
  });

  it("sur mobile, pose trois onglets égaux en bas de l'écran : Foyer, Habitants, Récits (US-0324)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    expect(mobile).toMatch(/\.entrees \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    // Le trait de l'entrée affichée souligne son nom, pas la pastille des Récits non lus.
    expect(css).toMatch(/\.entree\[aria-current="page"\] \.libelle \{[^}]*text-decoration: underline/);
  });

  it("sur mobile, range les quatre ressources puis le compteur d'Habitants en colonnes égales : cinq sur la bande (US-0304)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    expect(mobile).toMatch(/\.ressources \{[^}]*grid-auto-columns: minmax\(0, 1fr\);[^}]*grid-auto-flow: column;/);
    expect(mobile).toMatch(/\.groupes \{[^}]*grid-column: span 4;/);
    // Le compteur, séparé des ressources du même trait que les deux groupes entre eux.
    expect(mobile).toMatch(/\.groupe \+ \.groupe,\s*\.groupes \+ \.habitants \{[^}]*background: linear-gradient/);
  });

  it("montre le solde horaire sous la quantité sur mobile, sur une troisième ligne de la bande, qui grandit d'autant (US-0319)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    // Jamais caché : à côté de la quantité dès 821 px, dessous sur mobile.
    expect(css).not.toMatch(/\.solde \{[^}]*display: none/);
    expect(mobile).toMatch(/grid-template-areas: "icone" "quantite" "solde";/);
    expect(mobile).toMatch(/\.solde \{[^}]*grid-area: solde;/);
    expect(readFileSync(join(process.cwd(), "src/styles/formes.css"), "utf8")).toMatch(/@media \(max-width: 820px\) \{\s*:root:has\(\[data-bande-ressources\]\) \{\s*--hauteur-bande: 56px;/);
  });

  it("sur mobile, ouvre le détail d'une ressource dans un panneau en bas de l'écran, au-dessus des onglets, avec un bouton « Fermer » de 44 px (US-0319)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    expect(mobile).toMatch(/\.bulle,[^{]*\{[^}]*position: fixed;[^}]*right: 0;[^}]*bottom: calc\(var\(--hauteur-onglets\) \+ var\(--bord-bas\)\);[^}]*left: 0;/);
    // Seul un toucher l'ouvre : ni le survol ni le clavier ne font monter le panneau.
    expect(mobile).toMatch(/\.ressource:not\(\[data-ouverte\]\) \.bulle \{[^}]*visibility: hidden;/);
    expect(mobile).toMatch(/\.ressource\[data-ouverte\] \.bulle \{[^}]*pointer-events: auto;/);
    expect(mobile).toMatch(/\.fermer \{[^}]*display: block;[^}]*min-height: 44px;/);
    // Sur ordinateur, la bulle reste une bulle, sans bouton.
    expect(css.slice(0, css.indexOf("@media (max-width: 820px)"))).toMatch(/\.fermer \{\s*display: none;/);
  });
});
