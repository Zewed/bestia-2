import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Inscription from "./page";

describe("formulaire d'inscription", () => {
  const html = renderToStaticMarkup(<Inscription />);
  const champs = [...html.matchAll(/<input [^>]*>/g)].map((m) => m[0]);

  it("ne demande que l'adresse e-mail et le mot de passe", () => {
    expect(champs).toHaveLength(2);
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain("Adresse e-mail");
    expect(html).toContain("Mot de passe");
  });

  it("ouvre le clavier avec « @ » et laisse le navigateur proposer un mot de passe fort", () => {
    expect(champs[0]).toMatch(/type="email"/);
    expect(champs[0]).toMatch(/inputMode="email"/);
    expect(champs[0]).toMatch(/autoComplete="email"/);
    expect(champs[1]).toMatch(/type="password"/);
    expect(champs[1]).toMatch(/autoComplete="new-password"/);
  });

  it("place « Créer mon compte » sous les champs, et « J'ai déjà un compte » mène à la connexion", () => {
    expect(html.indexOf("Créer mon compte")).toBeGreaterThan(html.lastIndexOf("<input"));
    expect(html).toMatch(/<button type="submit"[^>]*>Créer mon compte<\/button>/);
    expect(html).toMatch(/<a [^>]*href="\/connexion"[^>]*>J&#x27;ai déjà un compte<\/a>/);
  });
});
