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
});
