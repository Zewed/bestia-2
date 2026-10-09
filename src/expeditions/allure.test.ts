import { afterEach, describe, expect, it, vi } from "vitest";
import { MARCHE_DES_EXPLORATEURS_KMH, PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";
import { definirAncre, maintenant } from "@/temps/horloge";
import { allureMinutesParCase, dureeDuTrajetMinutes, sansEscorte, vitesseDUneExpedition } from "./allure";
import { phaseDUneExpedition } from "./phase";

/** Les vitesses réelles des trois premières Espèces (donnees/especes.yaml), en km/h. */
const SOURIS = 13;
const POULE = 14;
const PIGEON = 80;
/** Une Bête plus lente que la marche des explorateurs, pour l'essai. */
const LENTE = 3;

describe("l'allure d'une Expédition sans escorte (US-0909)", () => {
  it("part sans escorte quand aucune Bête ne l'accompagne, quelle que soit l'Espèce", () => {
    expect(sansEscorte(new Map())).toBe(true);
    expect(sansEscorte(new Map([["souris", 0]]))).toBe(true);
    expect(sansEscorte(new Map([["souris", 0], ["poule", 0]]))).toBe(true);
    expect(sansEscorte(new Map([["souris", 0], ["poule", 1]]))).toBe(false);
    expect(sansEscorte(new Map([["souris", 3]]))).toBe(false);
  });

  it("avance au pas des explorateurs, celui des réglages : 20 minutes de jeu par Case pour l'instant", () => {
    expect(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE).toBe(20);
    expect(allureMinutesParCase([])).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
    expect(allureMinutesParCase([{ vitesse: LENTE, nombre: 0 }])).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });
});

describe("l'allure d'une escorte (US-0912)", () => {
  it("va à la marche des explorateurs, 5 km/h pour l'instant, que le pas des explorateurs met 20 minutes de jeu à couvrir", () => {
    expect(MARCHE_DES_EXPLORATEURS_KMH).toBe(5);
    expect(vitesseDUneExpedition([])).toBe(MARCHE_DES_EXPLORATEURS_KMH);
  });

  it("va au pas de la Bête la plus lente de l'escorte, d'après la vitesse de son Espèce", () => {
    expect(vitesseDUneExpedition([{ vitesse: 4, nombre: 1 }])).toBe(4);
    expect(vitesseDUneExpedition([{ vitesse: PIGEON, nombre: 3 }, { vitesse: LENTE, nombre: 1 }, { vitesse: 4, nombre: 2 }])).toBe(LENTE);
    // Une Bête deux fois plus lente que les explorateurs met deux fois plus de temps à passer chaque Case.
    expect(allureMinutesParCase([{ vitesse: 2.5, nombre: 1 }])).toBe(2 * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });

  it("ne compte pas les Espèces dont aucune Bête ne part", () => {
    expect(vitesseDUneExpedition([{ vitesse: LENTE, nombre: 0 }, { vitesse: 4, nombre: 1 }])).toBe(4);
  });

  it("garde le pas des explorateurs quand toutes les Bêtes vont plus vite qu'eux : l'Expédition va au plus lent des deux", () => {
    expect(vitesseDUneExpedition([{ vitesse: SOURIS, nombre: 3 }, { vitesse: POULE, nombre: 1 }, { vitesse: PIGEON, nombre: 2 }])).toBe(MARCHE_DES_EXPLORATEURS_KMH);
    expect(allureMinutesParCase([{ vitesse: SOURIS, nombre: 3 }])).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });

  it("met 20 × 5 / v minutes de jeu par Case à une Bête de v km/h, arrondies à la minute supérieure", () => {
    expect(allureMinutesParCase([{ vitesse: 4, nombre: 1 }])).toBe(25);
    // 33 minutes et un tiers.
    expect(allureMinutesParCase([{ vitesse: LENTE, nombre: 1 }])).toBe(34);
    expect(allureMinutesParCase([{ vitesse: 0.5, nombre: 1 }])).toBe(200);
  });
});

describe("la durée du trajet (US-0912)", () => {
  it("compte chaque Case de la distance à l'allure de l'Expédition : sans escorte, au pas des explorateurs", () => {
    expect(dureeDuTrajetMinutes(7, [])).toBe(7 * PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
    expect(dureeDuTrajetMinutes(1, [])).toBe(PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE);
  });

  it("dépend de la distance en Cases : deux fois plus loin, deux fois plus long", () => {
    expect(dureeDuTrajetMinutes(8, [{ vitesse: LENTE, nombre: 1 }])).toBe(2 * dureeDuTrajetMinutes(4, [{ vitesse: LENTE, nombre: 1 }]));
  });

  it("avec une escorte, au pas de sa Bête la plus lente, ou des explorateurs s'ils sont plus lents encore", () => {
    expect(dureeDuTrajetMinutes(7, [{ vitesse: SOURIS, nombre: 1 }])).toBe(140);
    expect(dureeDuTrajetMinutes(7, [{ vitesse: SOURIS, nombre: 1 }, { vitesse: LENTE, nombre: 1 }])).toBe(7 * 34);
  });
});

describe("la durée du trajet en vitesse accélérée de développement (US-0912)", () => {
  afterEach(() => {
    definirAncre(null);
    vi.useRealTimers();
  });

  it("raccourcit l'aller, le séjour et le retour d'autant : à ×60, une minute de jeu passe en une seconde", () => {
    vi.useFakeTimers({ now: new Date("2026-10-09T07:42:00.000Z") });
    definirAncre({ facteur: 60, reel: Date.now(), jeu: Date.now() });
    // Une escorte lente, à 7 Cases : 238 minutes de jeu d'aller, 1 h de séjour, et autant de retour que d'aller.
    const trajetMinutes = dureeDuTrajetMinutes(7, [{ vitesse: LENTE, nombre: 1 }]);
    const expedition = { partLe: maintenant(), trajetMinutes, sejourMinutes: 60 };
    vi.advanceTimersByTime((trajetMinutes - 1) * 1000);
    expect(phaseDUneExpedition(expedition, maintenant())).toBe("aller");
    vi.advanceTimersByTime(1000);
    expect(phaseDUneExpedition(expedition, maintenant())).toBe("sejour");
    vi.advanceTimersByTime(60 * 1000);
    expect(phaseDUneExpedition(expedition, maintenant())).toBe("retour");
  });
});
