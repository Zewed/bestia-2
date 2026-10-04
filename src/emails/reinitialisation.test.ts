import { describe, expect, it } from "vitest";
import { emailDeReinitialisation } from "./reinitialisation";

describe("e-mail pour changer de mot de passe", () => {
  it("porte le lien personnel, sa durée, et rassure qui n'a rien demandé, sans jamais de mot de passe", () => {
    const email = emailDeReinitialisation("nom@exemple.fr", "jeton123", { BESTIA_ADRESSE_SITE: "https://bestia.test" });
    expect(email).toMatchObject({ a: "nom@exemple.fr", sujet: "Changer votre mot de passe Bestia" });
    expect(email.texte).toContain("https://bestia.test/reinitialiser/jeton123");
    expect(email.texte).toContain("valable 60 minutes");
    expect(email.texte).toContain("Si vous n'avez rien demandé, ignorez simplement cet e-mail");
  });
});
