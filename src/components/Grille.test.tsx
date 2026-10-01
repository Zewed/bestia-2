import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bloc } from "./Bloc";
import { Grille } from "./Grille";

describe("grille Bento", () => {
  it("garde les blocs dans l'ordre de lecture", () => {
    const html = renderToStaticMarkup(
      <Grille>
        <Bloc titre="Un">a</Bloc>
        <Bloc titre="Deux">b</Bloc>
        <Bloc titre="Trois">c</Bloc>
      </Grille>,
    );
    expect(html.indexOf("Un")).toBeLessThan(html.indexOf("Deux"));
    expect(html.indexOf("Deux")).toBeLessThan(html.indexOf("Trois"));
  });

  it("laisse un bloc occuper plusieurs colonnes", () => {
    const html = renderToStaticMarkup(<Bloc largeur={7}>large</Bloc>);
    expect(html).toContain('style="--largeur:7"');
    expect(html).not.toContain("data-etroit");
  });

  it("marque les blocs d'une demi-largeur ou moins, rangés par deux sur tablette", () => {
    expect(renderToStaticMarkup(<Bloc largeur={6}>moitié</Bloc>)).toContain('data-etroit=""');
    expect(renderToStaticMarkup(<Bloc largeur={3}>quart</Bloc>)).toContain('data-etroit=""');
  });

  it("prend toute la largeur par défaut", () => {
    const html = renderToStaticMarkup(<Bloc>plein</Bloc>);
    expect(html).not.toContain("--largeur");
    expect(html).not.toContain("data-etroit");
  });
});
