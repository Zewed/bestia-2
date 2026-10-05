import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { rattraperLesAbsents } from "./absents";
import { lireMarquePage } from "./marque-page";

const T0 = new Date("2026-01-01T00:00:00Z");
const INSTANT = new Date("2026-01-02T00:00:00Z");
const ilYA = (minutes: number) => new Date(INSTANT.getTime() - minutes * 60_000);

describe.skipIf(!URL_TEST)("tâche planifiée pour les absents (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });

  async function mondes(...marquePages: Date[]): Promise<number[]> {
    const ids: number[] = [];
    for (const m of marquePages) {
      const { rows } = await pool.query<{ id: number }>(
        "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
        [`essai-${randomUUID()}`, m],
      );
      ids.push(rows[0].id);
    }
    return ids;
  }

  it("avance ce qui n'a pas été calculé depuis plus de 5 minutes, et rien d'autre", async () => {
    const [vieux, recent] = await mondes(T0, ilYA(2));
    const passage = await rattraperLesAbsents({ pool, maintenant: INSTANT, parmi: { monde: [vieux, recent] } });
    expect(passage).toMatchObject({ rattrapes: 1, echecs: 0, restants: 0 });
    expect(await lireMarquePage(pool, "monde", vieux)).toEqual(INSTANT);
    expect(await lireMarquePage(pool, "monde", recent)).toEqual(ilYA(2));
  });

  it("travaille par lots et reprend la suite au passage suivant", async () => {
    const ids = await mondes(T0, T0, T0);
    expect(await rattraperLesAbsents({ pool, maintenant: INSTANT, parmi: { monde: ids }, tailleLot: 2 })).toMatchObject({
      rattrapes: 2,
      restants: 1,
    });
    expect(await rattraperLesAbsents({ pool, maintenant: INSTANT, parmi: { monde: ids }, tailleLot: 2 })).toMatchObject({
      rattrapes: 1,
      restants: 0,
    });
  });

  it("s'arrête quand son budget de temps est épuisé", async () => {
    const ids = await mondes(T0, T0);
    const passage = await rattraperLesAbsents({ pool, maintenant: INSTANT, parmi: { monde: ids }, budgetMs: -1 });
    expect(passage).toMatchObject({ rattrapes: 0, restants: 2 });
  });

  it("continue quand un élément est en panne", async () => {
    const [enPanne, sain] = await mondes(T0, ilYA(10));
    const passage = await rattraperLesAbsents({
      pool,
      maintenant: INSTANT,
      parmi: { monde: [enPanne, sain] },
      regles: {
        evoluer: async (_c, id) => {
          if (id === enPanne) throw new Error("panne");
        },
      },
    });
    expect(passage).toMatchObject({ rattrapes: 1, echecs: 1, restants: 1 });
    expect(await lireMarquePage(pool, "monde", sain)).toEqual(INSTANT);
  });
});
