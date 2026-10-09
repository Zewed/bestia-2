import { describe, expect, it } from "vitest";
import { issueDUneRencontre } from "./recit-de-rencontre";

describe("ce qu'il advint de la Bête d'une Rencontre (US-0940)", () => {
  const fin = new Date("2026-10-09T16:00:00Z");
  const avant = new Date("2026-10-09T15:59:59.999Z");

  it("apprivoisée, elle a suivi l'Expédition, quel que soit son départ", () => {
    expect(issueDUneRencontre(true, avant, fin)).toBe("apprivoisee");
    expect(issueDUneRencontre(true, null, fin)).toBe("apprivoisee");
  });

  it("trop forte, elle est restée sur sa Case tant qu'elle y était encore quand l'Expédition l'a quittée", () => {
    expect(issueDUneRencontre(false, new Date("2026-10-09T18:30:00Z"), fin)).toBe("restee");
    // Parties au même instant : la Bête était encore là jusqu'au bout du séjour.
    expect(issueDUneRencontre(false, fin, fin)).toBe("restee");
  });

  it("partie de sa Case avant la fin du séjour, elle est repartie à la fin de sa durée", () => {
    expect(issueDUneRencontre(false, avant, fin)).toBe("repartie");
  });

  it("sans départ connu, elle est restée", () => {
    expect(issueDUneRencontre(false, null, fin)).toBe("restee");
  });
});
