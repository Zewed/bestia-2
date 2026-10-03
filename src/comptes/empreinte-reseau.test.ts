import { describe, expect, it } from "vitest";
import { adresseReseau, empreinteReseau } from "./empreinte-reseau";

describe("empreinte de la connexion", () => {
  it("prend l'adresse posée par la plateforme, la première de la liste", () => {
    expect(adresseReseau(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(adresseReseau(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(adresseReseau(new Headers())).toBe("inconnue");
  });

  it("ne garde jamais l'adresse elle-même, et dépend du secret", () => {
    const empreinte = empreinteReseau("203.0.113.7", "secret-a");
    expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinte).not.toContain("203");
    expect(empreinteReseau("203.0.113.7", "secret-a")).toBe(empreinte);
    expect(empreinteReseau("203.0.113.7", "secret-b")).not.toBe(empreinte);
    expect(empreinteReseau("203.0.113.8", "secret-a")).not.toBe(empreinte);
  });

  it("refuse de travailler sans son secret, en le nommant", () => {
    expect(() => empreinteReseau("203.0.113.7", "")).toThrow(/EMPREINTE_RESEAU_SECRET/);
  });
});
