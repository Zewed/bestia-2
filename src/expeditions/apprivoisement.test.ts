import { describe, expect, it } from "vitest";
import { aPortee, type ExpeditionSurLaCase, lExpeditionSuivie, vueLe } from "./apprivoisement";

const HEURE_MS = 3_600_000;
/** L'instant du jeu `heures` heures après une origine quelconque. */
const h = (heures: number) => new Date(Date.UTC(2026, 9, 9) + heures * HEURE_MS);

/** Une Bête rare de force 1 000 sur sa Case de 10 h à 16 h, sauf précision. */
const rare = (attributs: Partial<{ arrivee: Date; depart: Date; force: number; rareteId: string }> = {}) => ({
  arrivee: h(10),
  depart: h(16),
  force: 1_000,
  rareteId: "rare",
  ...attributs,
});
/** Une Expédition sur la Case de `de` à `a` heures, d'escorte de force `escorte` (null : sans escorte). */
const expedition = (id: number, de: number, a: number, escorte: number | null): ExpeditionSurLaCase => ({ id, arrivee: h(de), depart: h(a), escorte });

describe("la Bête à portée (US-0934)", () => {
  it("est à portée quand la force de l'escorte est au moins égale à celle de son Espèce", () => {
    expect(aPortee(1_000, rare())).toBe(true);
    expect(aPortee(1_001, rare())).toBe(true);
    expect(aPortee(999, rare())).toBe(false);
  });

  it("une Bête commune l'est toujours, même plus forte que l'escorte", () => {
    expect(aPortee(1, rare({ rareteId: "commune", force: 23_029 }))).toBe(true);
    expect(aPortee(0, rare({ rareteId: "commune" }))).toBe(true);
  });

  it("une escorte de force nulle a à portée les Bêtes de force nulle", () => {
    expect(aPortee(0, rare({ force: 0 }))).toBe(true);
    expect(aPortee(0, rare({ force: 1 }))).toBe(false);
  });

  it("une Expédition sans escorte n'en a encore aucune à portée : le cas revient à US-0935", () => {
    expect(aPortee(null, rare({ rareteId: "commune", force: 0 }))).toBe(false);
  });
});

describe("l'instant où une Expédition voit une Bête (US-0932)", () => {
  it("à son apparition, ou à l'arrivée de l'Expédition si elle était déjà là, tant qu'aucune n'est partie", () => {
    expect(vueLe(rare(), expedition(1, 8, 12, null))).toEqual(h(10));
    expect(vueLe(rare(), expedition(1, 11, 12, null))).toEqual(h(11));
    expect(vueLe(rare(), expedition(1, 6, 10, null))).toBeNull();
    expect(vueLe(rare(), expedition(1, 16, 18, null))).toBeNull();
  });
});

describe("l'Expédition que la Bête suit (US-0934)", () => {
  it("la Bête suit l'Expédition qui l'a à portée, à l'instant où elle la voit", () => {
    expect(lExpeditionSuivie(rare(), [expedition(7, 12, 14, 1_000)])).toEqual({ expeditionId: 7, le: h(12) });
    expect(lExpeditionSuivie(rare(), [expedition(7, 8, 14, 5_000)])).toEqual({ expeditionId: 7, le: h(10) });
  });

  it("une escorte trop faible la voit sans qu'elle la suive : elle reste sur sa Case", () => {
    expect(lExpeditionSuivie(rare(), [expedition(7, 8, 14, 999)])).toBeNull();
  });

  it("elle suit la première qui la voit et l'a à portée, tous Territoires confondus, après une trop faible", () => {
    const suivie = lExpeditionSuivie(rare(), [expedition(3, 13, 15, 2_000), expedition(1, 8, 20, 10), expedition(2, 11, 12, 1_000), expedition(4, 12, 13, null)]);
    expect(suivie).toEqual({ expeditionId: 2, le: h(11) });
  });

  it("à égalité d'instant, elle suit celle de plus petit identifiant", () => {
    expect(lExpeditionSuivie(rare(), [expedition(9, 8, 12, 1_000), expedition(5, 9, 12, 1_000)])).toEqual({ expeditionId: 5, le: h(10) });
  });

  it("une Expédition partie avant l'apparition, ou arrivée après le départ de la Bête, ne l'emmène pas", () => {
    expect(lExpeditionSuivie(rare(), [expedition(1, 6, 10, 5_000), expedition(2, 16, 18, 5_000)])).toBeNull();
  });
});
