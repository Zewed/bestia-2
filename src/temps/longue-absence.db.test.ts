import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { avancer, type Regles } from "./avancer";
import { lireMarquePage } from "./marque-page";

const T0 = new Date("2026-01-01T00:00:00Z");
const HEURE = 3_600_000;
const JOURS = 30;
const NB_EVENEMENTS = 300;

// 300 événements répartis sur 30 jours, toujours les mêmes (tirage déterministe).
function evenements(): { instant: Date; type: "prelevement" | "bonus" }[] {
  let graine = 42;
  const hasard = () => ((graine = (graine * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
  return Array.from({ length: NB_EVENEMENTS }, () => ({
    instant: new Date(T0.getTime() + Math.floor(hasard() * JOURS * 24 * HEURE)),
    type: hasard() < 0.5 ? ("prelevement" as const) : ("bonus" as const),
  }));
}

// Les règles d'essai : +10 par heure, « prelevement » retire 10 %, « bonus » ajoute 100.
const appliquer = { prelevement: (s: number) => s * 0.9, bonus: (s: number) => s + 100 };

// La même chose calculée heure par heure, sans base : la référence.
function simulerHeureParHeure(liste: ReturnType<typeof evenements>): number {
  const tries = [...liste].sort((a, b) => a.instant.getTime() - b.instant.getTime());
  let stock = 0;
  let curseur = T0.getTime();
  let i = 0;
  for (let h = 1; h <= JOURS * 24; h++) {
    const finHeure = T0.getTime() + h * HEURE;
    while (i < tries.length && tries[i].instant.getTime() <= finHeure) {
      stock += (10 * (tries[i].instant.getTime() - curseur)) / HEURE;
      curseur = tries[i].instant.getTime();
      stock = appliquer[tries[i].type](stock);
      i += 1;
    }
    stock += (10 * (finHeure - curseur)) / HEURE;
    curseur = finHeure;
  }
  return stock;
}

describe.skipIf(!URL_TEST)("longue absence (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });

  it(`rattrape ${JOURS} jours et ${NB_EVENEMENTS} événements en moins d'une seconde, comme heure par heure`, async () => {
    const liste = evenements();
    const { rows } = await pool.query<{ id: number }>(
      "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
      [`essai-${randomUUID()}`, T0],
    );
    const id = rows[0].id;
    await pool.query(
      `insert into evenement (element, element_id, survient_le, type)
       select 'monde', $1, instant, type from unnest($2::timestamptz[], $3::text[]) as e(instant, type)`,
      [id, liste.map((e) => e.instant), liste.map((e) => e.type)],
    );

    let stock = 0;
    const regles: Regles = {
      evoluer: async (_c, _id, depuis, jusqua) => {
        stock += (10 * (jusqua.getTime() - depuis.getTime())) / HEURE;
      },
      evenements: {
        prelevement: async () => void (stock = appliquer.prelevement(stock)),
        bonus: async () => void (stock = appliquer.bonus(stock)),
      },
    };

    const debut = performance.now();
    const fait = await avancer(pool, "monde", id, regles, new Date(T0.getTime() + JOURS * 24 * HEURE));
    const duree = performance.now() - debut;

    expect(fait?.evenements).toBe(NB_EVENEMENTS);
    expect(duree).toBeLessThan(1000);
    expect(stock).toBeCloseTo(simulerHeureParHeure(liste), 6);
    expect(await lireMarquePage(pool, "monde", id)).toEqual(new Date(T0.getTime() + JOURS * 24 * HEURE));
    console.info(`Longue absence : ${JOURS} jours et ${NB_EVENEMENTS} événements rattrapés en ${Math.round(duree)} ms.`);
  });
});
