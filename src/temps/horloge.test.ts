import { afterEach, describe, expect, it, vi } from "vitest";
import { formaterInstant } from "./affichage";
import { maintenant } from "./horloge";

afterEach(() => {
  vi.useRealTimers();
});

describe("heure du jeu", () => {
  it("vient de l'horloge du serveur, et d'elle seule", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T18:00:00Z"));
    expect(maintenant()).toEqual(new Date("2026-06-01T18:00:00Z"));
  });

  it("s'affiche dans le fuseau du joueur, à partir du même instant universel", () => {
    const instant = new Date("2026-06-01T18:00:00Z");
    expect(formaterInstant(instant, "Europe/Paris")).toBe("1 juin 2026 à 20:00");
    expect(formaterInstant(instant, "America/Montreal")).toBe("1 juin 2026 à 14:00");
    expect(formaterInstant(instant, "UTC")).toBe("1 juin 2026 à 18:00");
  });
});
