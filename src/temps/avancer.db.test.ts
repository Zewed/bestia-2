import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { avancer, programmerEvenement, type Regles } from "./avancer";
import { lireMarquePage } from "./marque-page";

const T0 = new Date("2026-01-01T00:00:00Z");
const heures = (n: number) => new Date(T0.getTime() + n * 3_600_000);
const duree = (depuis: Date, jusqua: Date) => (jusqua.getTime() - depuis.getTime()) / 3_600_000;

// Un compteur d'essai : il produit 10 par heure ; « prelevement » en retire la moitié,
// « noter » relève sa valeur à l'instant de l'événement.
function compteurDEssai() {
  const stock = new Map<number, number>();
  const releves: { id: number; heure: number; stock: number }[] = [];
  let appelsEvoluer = 0;
  const regles: Regles = {
    evoluer: async (_client, id, depuis, jusqua) => {
      appelsEvoluer += 1;
      stock.set(id, (stock.get(id) ?? 0) + 10 * duree(depuis, jusqua));
    },
    evenements: {
      prelevement: async (_client, id) => {
        stock.set(id, (stock.get(id) ?? 0) / 2);
      },
      noter: async (_client, id, evenement) => {
        releves.push({ id, heure: duree(T0, evenement.survientLe), stock: stock.get(id) ?? 0 });
      },
    },
  };
  return { stock, releves, regles, appels: () => appelsEvoluer };
}

describe.skipIf(!URL_TEST)("mécanisme unique du temps (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });

  async function mondeDEssai(): Promise<number> {
    const { rows } = await pool.query<{ id: number }>(
      "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
      [`essai-${randomUUID()}`, T0],
    );
    return rows[0].id;
  }

  it("donne le même résultat en dix heures d'un coup qu'en dix fois une heure", async () => {
    const { stock, regles } = compteurDEssai();
    const dUnCoup = await mondeDEssai();
    const parHeure = await mondeDEssai();
    // Un prélèvement à 3 h 12 : le stock vaut alors 32, il tombe à 16, puis remonte de 68.
    await programmerEvenement(pool, "monde", dUnCoup, heures(3.2), "prelevement");
    await programmerEvenement(pool, "monde", parHeure, heures(3.2), "prelevement");

    await avancer(pool, "monde", dUnCoup, regles, heures(10));
    for (let h = 1; h <= 10; h++) await avancer(pool, "monde", parHeure, regles, heures(h));

    expect(stock.get(dUnCoup)).toBeCloseTo(84, 9);
    expect(stock.get(parHeure)).toBeCloseTo(84, 9);
  });

  it("ne change rien quand la durée est nulle", async () => {
    const { regles, appels } = compteurDEssai();
    const id = await mondeDEssai();
    expect(await avancer(pool, "monde", id, regles, T0)).toBeNull();
    expect(appels()).toBe(0);
    expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
  });

  it("traite les événements dans l'ordre de leur date, chacun à son instant exact", async () => {
    const { releves, regles } = compteurDEssai();
    const id = await mondeDEssai();
    for (const h of [5, 2, 7]) await programmerEvenement(pool, "monde", id, heures(h), "noter");
    const resultat = await avancer(pool, "monde", id, regles, heures(10));
    expect(resultat?.evenements).toBe(3);
    expect(releves.filter((r) => r.id === id).map((r) => [r.heure, Math.round(r.stock)])).toEqual([
      [2, 20],
      [5, 50],
      [7, 70],
    ]);
  });

  it("traite chaque événement une seule fois, et pas avant son heure", async () => {
    const { releves, regles } = compteurDEssai();
    const id = await mondeDEssai();
    await programmerEvenement(pool, "monde", id, heures(1), "noter");
    await programmerEvenement(pool, "monde", id, heures(15), "noter");
    await avancer(pool, "monde", id, regles, heures(12));
    await avancer(pool, "monde", id, regles, heures(14));
    expect(releves.filter((r) => r.id === id).map((r) => r.heure)).toEqual([1]);
    await avancer(pool, "monde", id, regles, heures(16));
    expect(releves.filter((r) => r.id === id).map((r) => r.heure)).toEqual([1, 15]);
  });

  it("n'enregistre rien si un événement ne peut pas être appliqué", async () => {
    const { regles } = compteurDEssai();
    const id = await mondeDEssai();
    const evenement = await programmerEvenement(pool, "monde", id, heures(2), "inconnu");
    await expect(avancer(pool, "monde", id, regles, heures(4))).rejects.toThrow("Événement inconnu");
    expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
    const { rows } = await pool.query("select traite_le from evenement where id = $1", [evenement]);
    expect(rows[0].traite_le).toBeNull();
  });
});
