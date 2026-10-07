import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style de la partie « Aux portes », lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/app/jeu/habitants/AuxPortes.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne. */
const regle = (selecteur: string) => CSS.match(new RegExp(`\\n${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

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
