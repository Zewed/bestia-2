import { describe, expect, it } from "vitest";
import { calculerEmpreinte, verifierEmpreinte } from "./empreinte";

describe("empreinte du mot de passe", () => {
  const motDePasse = "une phrase de passe";

  it("ne contient jamais le mot de passe, et dit comment elle a été calculée", async () => {
    const empreinte = await calculerEmpreinte(motDePasse);
    expect(empreinte).not.toContain(motDePasse);
    expect(empreinte).toMatch(/^scrypt\$131072\$8\$1\$[A-Za-z0-9+/=]{24}\$[A-Za-z0-9+/=]{88}$/);
  });

  it("change à chaque calcul, même pour un même mot de passe (un sel par compte)", async () => {
    expect(await calculerEmpreinte(motDePasse)).not.toBe(await calculerEmpreinte(motDePasse));
  });

  it("reconnaît le bon mot de passe, et lui seul", async () => {
    const empreinte = await calculerEmpreinte(motDePasse);
    expect(await verifierEmpreinte(motDePasse, empreinte)).toBe(true);
    expect(await verifierEmpreinte("une phrase de passE", empreinte)).toBe(false);
    expect(await verifierEmpreinte(motDePasse, "pas une empreinte")).toBe(false);
  });

  it("traite pareil les écritures Unicode équivalentes d'un même mot de passe", async () => {
    const empreinte = await calculerEmpreinte("café des bêtes");
    expect(await verifierEmpreinte("café des bêtes", empreinte)).toBe(true);
  });
});
