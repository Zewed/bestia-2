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

  it("dans le jeu, n'est plus une barre : ses pièces se posent sur la carte, qui passe dessous et se manie entre elles", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const jeu = css.match(/\n\.barre:has\(\.navigation\) \{([^}]*)\}/)?.[1] ?? "";
    expect(jeu).toContain("position: fixed;");
    expect(jeu).toContain("pointer-events: none;");
    expect(css).toMatch(/\n\.barre:has\(\.navigation\) > \* \{\s*pointer-events: auto;/);
    // Sur ordinateur, la rangée des médaillons est posée au milieu, au pied de l'écran.
    expect(css).toMatch(/\n\.navigation \{[^}]*position: fixed;[^}]*bottom: calc\(10px \+ var\(--bord-bas\)\);[^}]*left: 50%;/);
  });

  it("sur un petit écran d'ordinateur, sous 1 100 px, passe les Stocks en rangée sous le blason et le nom (US-0324)", () => {
    const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
    expect(lire("src/styles/formes.css")).toMatch(/@media \(max-width: 1099px\) \{\s*:root:has\(\[data-bande-ressources\]\) \{\s*--hauteur-bande: 56px;/);
    const css = lire("src/components/BarreHaut.module.css");
    const petit = css.slice(css.indexOf("@media (min-width: 821px) and (max-width: 1099px)"), css.indexOf("@media (max-width: 820px) {"));
    expect(petit).not.toBe("");
    expect(petit).toMatch(/\.ressources \{[^}]*grid-column: 1 \/ -1;[^}]*grid-row: 2;/);
    expect(petit).not.toMatch(/\.navigation/);
  });

  it("sur mobile, pose cinq onglets en bas de l'écran : Foyer, Carte, Expéditions, Habitants, Récits (US-0324, US-0417, US-0901)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px)"));
    // À parts égales, sauf un nom qui n'y tiendrait pas : 1fr ne descend pas sous la largeur de son contenu.
    expect(mobile).toMatch(/\.entrees \{[^}]*grid-template-columns: repeat\(5, 1fr\);/);
    // 64 px en moyenne sur 320 px : le nom en 12 px, pour que « Expéditions », « Habitants » et son point, « Récits » et « 99+ » y tiennent.
    expect(mobile).toMatch(/\.entree \{[^}]*font-size: 12px;/);
    // Le trait de l'entrée affichée souligne son nom, pas la pastille des Récits non lus.
    expect(css).toMatch(/\.entree\[aria-current="page"\] \.libelle \{[^}]*text-decoration: underline/);
  });

  it("sur mobile, range les quatre ressources puis le compteur d'Habitants en colonnes égales : cinq sur la bande (US-0304)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px) {"));
    expect(mobile).toMatch(/\.ressources \{[^}]*grid-auto-columns: minmax\(0, 1fr\);[^}]*grid-auto-flow: column;/);
    expect(mobile).toMatch(/\.groupes \{[^}]*grid-column: span 4;/);
    // Chaque Stock, et le compteur, dans son propre jeton, écartés du même pas.
    expect(mobile).toMatch(/\.groupe \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*gap: 6px;/);
  });

  it("montre le solde horaire sous la quantité sur mobile, sur une troisième ligne de la bande, qui grandit d'autant (US-0319)", () => {
    const css = readFileSync(join(process.cwd(), "src/components/BarreHaut.module.css"), "utf8");
    const mobile = css.slice(css.indexOf("@media (max-width: 820px) {"));
    // Jamais caché : sous la quantité, l'icône à gauche des deux, sur ordinateur comme sur mobile.
    expect(css).not.toMatch(/\.solde \{[^}]*display: none/);
    expect(css).toMatch(/grid-template-areas: "icone quantite plein" "icone solde solde";/);
    expect(mobile).toMatch(/grid-template-areas: "icone quantite" "icone solde";/);
    expect(css).toMatch(/\n\.solde \{[^}]*grid-area: solde;/);
    expect(readFileSync(join(process.cwd(), "src/styles/formes.css"), "utf8")).toMatch(/@media \(max-width: 820px\) \{\s*:root:has\(\[data-bande-ressources\]\) \{\s*--hauteur-bande: 52px;/);
  });

  describe("l'avertissement « famine imminente » (US-0321)", () => {
    const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
    const css = lire("src/components/BarreHaut.module.css");
    const formes = lire("src/styles/formes.css");
    /** Les déclarations d'une règle, dans `texte` (toute la feuille de la barre par défaut). */
    const regle = (selecteur: string, texte = css) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

    it("est un bandeau au milieu, sous les pièces du haut et la rangée des Stocks, au pouce", () => {
      expect(regle(".barre")).toContain("grid-template-rows: var(--hauteur-ligne) var(--hauteur-bande) var(--hauteur-alerte);");
      const famine = regle(".famine");
      expect(famine).toContain("grid-column: 1 / -1;");
      expect(famine).toContain("grid-row: 3;");
      expect(famine).toContain("justify-self: center;");
      expect(famine).toContain("min-height: 44px;");
    });

    it("fait grandir la barre de sa hauteur, pour que la page et les en-têtes collés restent justes dessous", () => {
      expect(formes).toMatch(/:root \{[^}]*--hauteur-alerte: 0px;/);
      expect(formes).toContain("--hauteur-barre: calc(var(--hauteur-ligne) + var(--hauteur-bande) + var(--hauteur-alerte) + var(--bord-haut));");
      expect(formes).toMatch(/\n:root:has\(\[data-alerte-famine\]\) \{\s*--hauteur-alerte: 52px;/);
      // Sur un téléphone, sur deux lignes : le bandeau grandit d'autant.
      expect(formes).toMatch(/@media \(max-width: 540px\) \{\s*:root:has\(\[data-alerte-famine\]\) \{\s*--hauteur-alerte: 60px;/);
    });

    it("prend la couleur d'alerte, un texte clair et lisible, sans clignoter, sur ordinateur comme sur mobile", () => {
      const famine = regle(".famine");
      expect(famine).toContain("background: var(--mauvais);");
      expect(famine).toContain("color: var(--blanc-chaud);");
      expect(regle(".titreFamine")).toContain("font-weight: var(--graisse-titre);");
      expect(css).not.toMatch(/animation|@keyframes/);
      expect(css).not.toMatch(/\.famine[^{]*\{[^}]*display: none/);
      expect(regle(".famine:focus-visible")).toContain("outline: 2px solid var(--ivoire);");
    });
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
