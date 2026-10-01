import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarreHaut } from "./BarreHaut";
import { Logo } from "./Logo";

describe("logo du loup", () => {
  it("ramène à l'accueil", () => {
    expect(renderToStaticMarkup(<Logo />)).toMatch(/^<a [^>]*href="\/"/);
  });

  it("porte le texte de remplacement « Bestia »", () => {
    expect(renderToStaticMarkup(<Logo />)).toMatch(/^<a [^>]*aria-label="Bestia"/);
  });

  it("est dessiné en vecteur", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('<svg viewBox="0 0 48 48"');
    expect(html).not.toMatch(/<img|\.png|\.jpg/);
  });

  it("se place dans la barre du haut", () => {
    expect(renderToStaticMarkup(<BarreHaut />)).toMatch(/^<header[^>]*><a [^>]*aria-label="Bestia"/);
  });
});
