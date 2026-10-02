import { afterEach, describe, expect, it, vi } from "vitest";
import { formaterInstant } from "./affichage";
import { definirAncre, maintenant, vitesse, vitesseDemandee } from "./horloge";

afterEach(() => {
  vi.useRealTimers();
  definirAncre(null);
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

  it("passe cent fois plus vite à ×100 : une minute réelle, cent minutes de jeu", () => {
    vi.useFakeTimers();
    const reel = new Date("2026-06-01T18:00:00Z").getTime();
    vi.setSystemTime(reel);
    definirAncre({ facteur: 100, reel, jeu: reel });
    vi.setSystemTime(reel + 60_000);
    expect(maintenant()).toEqual(new Date(reel + 100 * 60_000));
    expect(vitesse()).toBe(100);
  });

  it("lit la vitesse dans la variable d'environnement", () => {
    expect(vitesseDemandee(undefined)).toBe(1);
    expect(vitesseDemandee("")).toBe(1);
    expect(vitesseDemandee("100")).toBe(100);
    expect(() => vitesseDemandee("vite")).toThrow(/BESTIA_VITESSE_TEMPS/);
    expect(() => vitesseDemandee("-2")).toThrow(/BESTIA_VITESSE_TEMPS/);
  });
});
