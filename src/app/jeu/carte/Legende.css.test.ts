import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { couleur } from "@/monde/couleurs-de-la-carte";
import { Legende } from "./Legende";

/** Un fichier du projet, lu tel qu'il est écrit. */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

describe("la légende de la carte à l'écran (US-0432)", () => {
  it("se pose en haut à droite de la carte, un bouton de 44 px ; sur mobile, dans un panneau en bas qui laisse voir la carte", () => {
    const css = lire("src/app/jeu/carte/Legende.module.css");
    expect(css).toMatch(/\.bouton \{[^}]*min-height: 44px;/);
    expect(css).toMatch(/\.legende \{[^}]*top: calc\(var\(--hauteur-barre\) \+ 12px\);[^}]*right: calc\(var\(--bord-droit\) \+ 12px\);/);
    const mobile = css.match(/@media \(max-width: 820px\) \{([\s\S]*?)\n\}/)![1];
    // Au-dessus des onglets, toute la largeur, sur moins de la moitié de la carte : on la voit au-dessus ; la légende y défile.
    expect(mobile).toMatch(/\.panneau \{[^}]*position: fixed;[^}]*bottom: calc\(var\(--hauteur-onglets\) \+ var\(--bord-bas\)\);[^}]*left: 0;/);
    expect(mobile).toMatch(/\.panneau \{[^}]*max-height: calc\(0\.45 \* var\(--hauteur-utile\)\);[^}]*overflow-y: auto;/);
  });

  it("peint ses échantillons des couleurs mêmes que la carte donne à son <canvas>", () => {
    const teintes = ["prairie", "jungle", "lac"].map((teinte) => ({ teinte, nom: teinte }));
    const html = renderToStaticMarkup(createElement(Legende, { terre: teintes.slice(0, 2), eaux: teintes.slice(2) }));
    const couleurs = new Set([...html.matchAll(/(?:fill|stroke):([^;"]+)/g)].map(([, c]) => c).filter((c) => c !== "none"));
    // Hors le fond de chaque teinte, que la page donne aux deux.
    const fonds = new Set(teintes.map((t) => couleur(t.teinte)));
    const autres = [...couleurs].filter((c) => !fonds.has(c));
    expect(autres.length).toBeGreaterThanOrEqual(5);
    const carte = lire("src/app/jeu/carte/CarteDuJeu.tsx");
    for (const c of autres) expect(carte, c).toContain(`"${c}"`);
  });
});
