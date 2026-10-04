import { describe, expect, it } from "vitest";
import { emailDeReinitialisation } from "./reinitialisation";

describe("e-mail « Mot de passe oublié »", () => {
  const email = emailDeReinitialisation("nom@exemple.fr", "jeton123", { BESTIA_ADRESSE_SITE: "https://bestia.test" });

  it("part au nom de Bestia, avec un bouton vers le lien personnel", () => {
    expect(email).toMatchObject({ a: "nom@exemple.fr", sujet: "Mot de passe oublié" });
    expect(email.html).toContain(">Mot de passe oublié ?</h1>");
    expect(email.html).toMatch(/<a href="https:\/\/bestia\.test\/reinitialiser\/jeton123"[^>]*>Changer mon mot de passe<\/a>/);
    expect(email.html).toContain('src="https://bestia.test/emails/loup.png"');
  });

  it("ne dit rien de plus : le titre et le bouton suffisent (décision d'Antoine)", () => {
    const visible = email.html!.replace(/<head>[\s\S]*<\/head>/, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(visible).toBe("Mot de passe oublié ? Changer mon mot de passe");
  });

  it("garde une version texte avec le lien, pour les messageries sans mise en forme", () => {
    expect(email.texte).toBe("Mot de passe oublié ? Changez-le ici :\nhttps://bestia.test/reinitialiser/jeton123");
  });
});
