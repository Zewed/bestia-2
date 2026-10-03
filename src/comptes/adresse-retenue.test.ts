// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { lireAdresseRetenue, retenirAdresse } from "./adresse-retenue";

describe("adresse retenue pour la connexion", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("est gardée dans la mémoire de l'onglet, pas dans l'adresse de la page", () => {
    expect(lireAdresseRetenue()).toBe("");
    retenirAdresse("nom@exemple.fr");
    expect(lireAdresseRetenue()).toBe("nom@exemple.fr");
    expect(location.href).not.toContain("nom@exemple.fr");
  });

  it("ne casse rien quand le navigateur refuse la mémoire d'onglet", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("refusé");
    });
    expect(() => retenirAdresse("nom@exemple.fr")).not.toThrow();
    expect(lireAdresseRetenue()).toBe("");
  });
});
