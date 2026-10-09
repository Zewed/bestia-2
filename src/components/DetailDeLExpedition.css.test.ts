import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** La feuille de style du détail d'une Expédition, lue telle qu'elle est écrite. */
const CSS = readFileSync(join(process.cwd(), "src/components/DetailDeLExpedition.module.css"), "utf8");

/** Les déclarations de la règle `selecteur`, écrite en tête de ligne, dans `texte` (toute la feuille par défaut). */
const regle = (selecteur: string, texte = CSS) => texte.match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\:,]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

describe("le détail d'une Expédition sur un téléphone (US-0918)", () => {
  const mobile = CSS.match(/@media \(max-width: 820px\), \(max-height: 500px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("sur ordinateur, se lit tout entier : la destination se plie, la phase et le temps restant gardent leur place, rien à déplier", () => {
    expect(regle(".ligne")).toContain("grid-template-columns: minmax(0, 1fr) auto auto;");
    expect(regle(".destination")).toContain("overflow-wrap: anywhere;");
    expect(regle(".reste")).toContain("white-space: nowrap;");
    expect(regle(".reste")).toContain("font-variant-numeric: tabular-nums;");
    expect(regle(".deplier")).toContain("display: none;");
  });

  it("repliée, tient sur une ligne : la destination se coupe, le temps restant sans son annonce, la distance et le détail attendent qu'on la déplie", () => {
    expect(regle(".repliable .ligne", mobile)).toContain("grid-template-columns: minmax(0, 1fr) auto auto 12px;");
    expect(regle(".repliable .ligne > *", mobile)).toContain("grid-row: 1;");
    expect(regle(".repliable .annonce", mobile)).toContain("display: none;");
    expect(regle(".repliable:not(.deplie) .destination", mobile)).toMatch(/overflow: hidden;[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/);
    expect(regle(".repliable:not(.deplie) .distance,\n  .repliable:not(.deplie) .detail", mobile)).toContain("display: none;");
  });

  it("dépliée, garde la même ligne, la distance dessous sur toute la largeur", () => {
    expect(regle(".repliable .distance", mobile)).toMatch(/grid-row: 2;[^}]*grid-column: 1 \/ -1;/);
    // La distance vient après la règle du premier rang, qu'elle remplace.
    expect(mobile.indexOf(".repliable .distance {")).toBeGreaterThan(mobile.indexOf(".repliable .ligne > * {"));
  });

  it("se déplie d'un toucher n'importe où sur elle, au pouce, et montre où est le clavier", () => {
    expect(regle(".repliable", mobile)).toContain("padding: 12px;");
    expect(regle(".expedition")).toContain("position: relative;");
    expect(regle(".deplier", mobile)).toContain("display: flex;");
    expect(regle(".deplier", mobile)).toContain("cursor: pointer;");
    expect(regle(".deplier::after", mobile)).toMatch(/position: absolute;[^}]*inset: 0;/);
    expect(regle(".deplier:focus-visible::after", mobile)).toContain("outline: 2px solid var(--encre);");
  });

  it("tient sans défilement de côté : rien n'y a de largeur fixe plus grande que l'écran", () => {
    expect(CSS).not.toMatch(/(?:^|[^-])width: \d{3,}px/);
    expect(regle(".detail > div", mobile)).toContain("grid-template-columns: 96px minmax(0, 1fr);");
  });
});
