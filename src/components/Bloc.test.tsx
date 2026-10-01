import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bloc } from "./Bloc";

describe("bloc Bento", () => {
  it("affiche son titre au-dessus du contenu", () => {
    const html = renderToStaticMarkup(
      <Bloc titre="Réserve">
        <p>Un Couple de souris</p>
      </Bloc>,
    );
    expect(html).toMatch(/^<section[^>]*><h2[^>]*>Réserve<\/h2><p>Un Couple de souris<\/p><\/section>$/);
  });

  it("se passe de titre", () => {
    const html = renderToStaticMarkup(<Bloc>Contenu seul</Bloc>);
    expect(html).not.toContain("<h2");
    expect(html).toContain("Contenu seul");
  });

  it("accepte n'importe quel contenu", () => {
    const html = renderToStaticMarkup(
      <Bloc titre="Foyer" plein>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/foyer.jpg" alt="Le Foyer" />
        <ul>
          <li>Bois</li>
        </ul>
      </Bloc>,
    );
    expect(html).toContain('<img src="/foyer.jpg" alt="Le Foyer"/>');
    expect(html).toContain("<li>Bois</li>");
  });
});
