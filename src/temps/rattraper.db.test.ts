import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { lireMarquePage } from "./marque-page";
import { RattrapageError, rattraper } from "./rattraper";

const T0 = new Date("2026-01-01T00:00:00Z");

describe.skipIf(!URL_TEST)("rattrapage avant lecture (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterEach(() => {
    vi.useRealTimers();
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

  // On avance seulement l'horloge du jeu, pas les minuteries de la connexion à la base.
  function horlogeA(instant: Date) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(instant);
  }

  it("avance l'élément jusqu'à maintenant avant de le lire", async () => {
    const id = await mondeDEssai();
    horlogeA(new Date("2026-01-01T12:00:00Z"));
    const intervalles: number[] = [];
    await rattraper("monde", id, {
      pool,
      regles: { evoluer: async (_c, _id, depuis, jusqua) => void intervalles.push(jusqua.getTime() - depuis.getTime()) },
    });
    expect(await lireMarquePage(pool, "monde", id)).toEqual(new Date("2026-01-01T12:00:00Z"));
    expect(intervalles).toEqual([12 * 3_600_000]);
  });

  it("deux ouvertures rapprochées ne rattrapent que le temps écoulé entre elles", async () => {
    const id = await mondeDEssai();
    const intervalles: number[] = [];
    const regles = { evoluer: async (_c: unknown, _id: number, depuis: Date, jusqua: Date) => void intervalles.push(jusqua.getTime() - depuis.getTime()) };
    horlogeA(new Date("2026-01-01T01:00:00Z"));
    await rattraper("monde", id, { pool, regles });
    horlogeA(new Date("2026-01-01T01:00:05Z"));
    await rattraper("monde", id, { pool, regles });
    expect(intervalles).toEqual([3_600_000, 5_000]);
  });

  it("signale un échec plutôt que de laisser lire un état périmé", async () => {
    const id = await mondeDEssai();
    horlogeA(new Date("2026-01-01T02:00:00Z"));
    await expect(
      rattraper("monde", id, { pool, regles: { evoluer: async () => Promise.reject(new Error("panne")) } }),
    ).rejects.toBeInstanceOf(RattrapageError);
    expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
  });
});
