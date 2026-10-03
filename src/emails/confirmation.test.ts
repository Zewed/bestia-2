import { describe, expect, it } from "vitest";
import { adresseDuSite, emailDeConfirmation } from "./confirmation";

describe("e-mail de confirmation", () => {
  it("prend l'adresse du site dans les réglages, jamais dans la requête", () => {
    expect(adresseDuSite({ BESTIA_ADRESSE_SITE: "http://localhost:3140/" })).toBe("http://localhost:3140");
    expect(adresseDuSite({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "bestia-2.vercel.app", VERCEL_URL: "bestia-2-abc.vercel.app" })).toBe(
      "https://bestia-2.vercel.app",
    );
    expect(adresseDuSite({ VERCEL_ENV: "preview", VERCEL_URL: "bestia-2-abc.vercel.app" })).toBe("https://bestia-2-abc.vercel.app");
    expect(adresseDuSite({})).toBe("http://localhost:3000");
  });

  it("porte le lien personnel, sa durée de validité, et rassure qui n'a rien demandé", () => {
    const email = emailDeConfirmation("nom@exemple.fr", "jeton123", { BESTIA_ADRESSE_SITE: "https://bestia.test" });
    expect(email).toMatchObject({ a: "nom@exemple.fr", sujet: "Confirmez votre adresse e-mail" });
    expect(email.texte).toContain("https://bestia.test/confirmer/jeton123");
    expect(email.texte).toContain("valable 24 heures");
    expect(email.texte).toContain("ignorez simplement cet e-mail");
  });
});
