import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PageIntrouvable, { metadata } from "./not-found";

describe("page introuvable", () => {
  const html = renderToStaticMarkup(<PageIntrouvable />);

  it("parle français", () => {
    expect(html).toContain("Page introuvable");
    expect(metadata.title).toBe("Page introuvable");
  });

  it("propose de revenir à l'accueil", () => {
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Revenir à l(&#x27;|')accueil<\/a>/);
  });
});
