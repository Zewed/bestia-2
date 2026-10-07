import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style de la partie « Aux portes », lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/habitants/AuxPortes.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, et seule (pas à la suite d'un autre sélecteur). */
const regle = (selecteur: string) => CSS.match(new RegExp(`(?<!,)\\n${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

/** Le nombre de pixels d'une déclaration de la règle `selecteur` (« gap: 12px; »), ou NaN. */
const pixels = (selecteur: string, propriete: string) => Number(regle(selecteur).match(new RegExp(`\\b${propriete}: (\\d+)px;`))?.[1]);

describe("la partie « Aux portes » sur mobile (US-0343)", () => {
  it("met chaque Voyageur dans un bloc à lui, les uns sous les autres, sur une seule colonne", () => {
    expect(regle(".voyageurs")).toContain("display: grid;");
    expect(regle(".voyageurs")).not.toContain("grid-template-columns");
    expect(regle(".voyageur")).toMatch(/border-radius: var\(--arrondi-petit\);[^}]*background: var\(--bloc-2\);/);
  });

  it("passe le bloc en une colonne quand la ligne est trop étroite pour le compte à rebours à côté : le prénom, depuis quand, puis le compte", () => {
    expect(regle(".voyageurs")).toContain("container-type: inline-size;");
    const etroit = CSS.match(/@container \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/);
    // Sous 280 px de ligne, comme sur un téléphone de 320 px ; 375 px et la colonne de l'ordinateur gardent le compte à côté.
    expect(Number(etroit?.[1])).toBe(279);
    expect(etroit?.[2]).toMatch(/\.voyageur \{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
    expect(etroit?.[2]).toMatch(/\.depart \{[^}]*grid-row: auto;[^}]*grid-column: auto;[^}]*text-align: left;/);
  });

  it("donne à « Accueillir » et « Refuser » au moins 44 px de haut et au moins 12 px d'écart, sur toute la largeur du bloc", () => {
    expect(pixels(".accueillir,\n.refuser", "min-height")).toBeGreaterThanOrEqual(44);
    expect(pixels(".choix", "gap")).toBeGreaterThanOrEqual(12);
    expect(regle(".choix")).toContain("grid-column: 1 / -1;");
    expect(regle(".accueillir,\n.refuser")).toMatch(/flex: 1 1 0;[^}]*min-width: 0;/);
  });

  it("fait de « Refuser » le bouton secondaire : cerné d'un trait sur le fond du bloc, quand « Accueillir » est plein, en Encre", () => {
    expect(regle(".accueillir")).toMatch(/background: var\(--encre\);[^}]*color: var\(--blanc-chaud\);/);
    expect(regle(".refuser")).toMatch(/background: var\(--bloc\);[^}]*box-shadow: inset 0 0 0 1px var\(--trait\);/);
  });

  it("ne pousse jamais la page de côté : ni largeur fixe, ni texte qui refuse d'aller à la ligne", () => {
    expect(CSS).not.toMatch(/[^-]width: \d/);
    expect(CSS).not.toMatch(/min-width: [1-9]/);
    expect(CSS).not.toContain("nowrap");
  });
});

describe("la partie « Aux portes », quand la place manque (US-0338)", () => {
  it("grise visiblement « Accueillir » éteint, qui ne change plus au survol", () => {
    expect(regle(".accueillir:disabled")).toMatch(/background: var\(--bloc-3\);[^}]*color: var\(--texte-pale\);[^}]*cursor: not-allowed;/);
    expect(CSS).toContain(".accueillir:not(:disabled):hover {");
    expect(CSS).not.toMatch(/\.accueillir:hover/);
  });

  it("met la phrase de la place manquante aux couleurs de « Plus de place »", () => {
    expect(regle(".plusDePlace")).toMatch(/background: var\(--sable\);[^}]*color: var\(--sable-fonce\);/);
  });
});

describe("la partie « Aux portes », son lien vers l'historique (US-0342)", () => {
  it("pose « Historique » à droite du titre de la partie, sur sa ligne ; tout le reste prend toute la largeur, dessous", () => {
    expect(regle(".auxPortes")).toMatch(/display: grid;[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(regle(".auxPortes > *")).toContain("grid-column: 1 / -1;");
    expect(regle(".auxPortes > h2")).toContain("grid-column: 1;");
    expect(regle(".historique")).toMatch(/grid-row: 1;[^}]*grid-column: 2;/);
  });

  it("en fait un lien discret, souligné, au pouce : au moins 44 px de haut, sans grandir la ligne du titre", () => {
    const historique = regle(".historique");
    expect(historique).toContain("color: var(--texte-discret);");
    expect(historique).toContain("text-decoration: underline;");
    expect(pixels(".historique", "min-height")).toBeGreaterThanOrEqual(44);
    expect(historique).toMatch(/margin: -\d+px/);
    expect(regle(".historique:focus-visible")).toContain("outline: 2px solid var(--encre);");
  });
});

describe("la partie « Aux portes », l'Entretien en plus et la confirmation (US-0340)", () => {
  /** Les déclarations de la règle `selecteur` dans le bloc « @media (hover: hover) », écrite en retrait. */
  const auSurvol = (selecteur: string) =>
    [...CSS.matchAll(/@media \(hover: hover\) \{([\s\S]*?)\n\}/g)]
      .map(([, bloc]) => bloc.match(new RegExp(`\\n  ${selecteur.replace(/[.*+?^${}()|[\]\\:]/g, "\\$&")} \\{([^}]*)\\}`))?.[1])
      .find(Boolean) ?? "";

  it("met le rappel de l'Entretien sous les boutons, sur toute la largeur de la ligne, en discret", () => {
    const entretien = regle(".entretien");
    expect(entretien).toContain("grid-column: 1 / -1;");
    expect(entretien).toContain("color: var(--texte-discret);");
    expect(pixels(".entretien", "font-size")).toBeLessThanOrEqual(13);
  });

  it("met « Confirmer l'accueil » dans la couleur d'alerte, qu'il garde au survol, et la phrase de la famine imminente en alerte, à la place du rappel", () => {
    expect(regle(".accueillir[data-confirmer]")).toMatch(/background: var\(--mauvais\);[^}]*color: var\(--blanc-chaud\);/);
    expect(auSurvol(".accueillir[data-confirmer]:hover")).toContain("background: var(--mauvais);");
    // Plus loin dans la feuille que le survol des autres « Accueillir », pour l'emporter sur lui.
    expect(CSS.indexOf(".accueillir[data-confirmer]:hover")).toBeGreaterThan(CSS.indexOf(".accueillir:not(:disabled):hover"));
    const confirmation = regle(".confirmation");
    expect(confirmation).toContain("grid-column: 1 / -1;");
    expect(confirmation).toMatch(/color: var\(--mauvais\);[^}]*font-weight: var\(--graisse-titre\);/);
  });
});
