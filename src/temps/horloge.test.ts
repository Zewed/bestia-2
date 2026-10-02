import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formaterInstant } from "./affichage";
import { avertissementProduction, definirAncre, maintenant, vitesse, vitesseDemandee } from "./horloge";

const environnement = process.env.VERCEL_ENV;

// Ces tests choisissent eux-mêmes leur environnement : sur Vercel, la construction tourne
// avec VERCEL_ENV=production, où l'accélération est justement interdite.
beforeEach(() => {
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  vi.useRealTimers();
  definirAncre(null);
  if (environnement === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = environnement;
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

  it("passe toujours à vitesse normale en production, quel que soit le réglage", () => {
    vi.useFakeTimers();
    const reel = new Date("2026-06-01T18:00:00Z").getTime();
    vi.setSystemTime(reel);
    definirAncre({ facteur: 100, reel, jeu: reel });
    vi.setSystemTime(reel + 60_000);
    process.env.VERCEL_ENV = "production";
    expect(maintenant()).toEqual(new Date(reel + 60_000));
    expect(vitesse()).toBe(1);
  });

  it("garde l'accélération possible sur les prévisualisations et en local", () => {
    vi.useFakeTimers();
    const reel = new Date("2026-06-01T18:00:00Z").getTime();
    vi.setSystemTime(reel);
    definirAncre({ facteur: 100, reel, jeu: reel });
    vi.setSystemTime(reel + 60_000);
    for (const env of ["preview", undefined]) {
      if (env) process.env.VERCEL_ENV = env;
      else delete process.env.VERCEL_ENV;
      expect(maintenant()).toEqual(new Date(reel + 100 * 60_000));
    }
  });

  it("signale au démarrage un réglage d'accélération trouvé en production", () => {
    expect(avertissementProduction({ VERCEL_ENV: "production", BESTIA_VITESSE_TEMPS: "100" })).toMatch(
      /BESTIA_VITESSE_TEMPS=100 est ignoré en production/,
    );
    expect(avertissementProduction({ VERCEL_ENV: "production" })).toBeNull();
    expect(avertissementProduction({ VERCEL_ENV: "production", BESTIA_VITESSE_TEMPS: "1" })).toBeNull();
    expect(avertissementProduction({ VERCEL_ENV: "preview", BESTIA_VITESSE_TEMPS: "100" })).toBeNull();
  });
});
