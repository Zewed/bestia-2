import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { avancerMarquePage, lireMarquePage } from "./marque-page";

const T0 = new Date("2026-01-01T00:00:00Z");
const heures = (n: number) => new Date(T0.getTime() + n * 3_600_000);

describe.skipIf(!URL_TEST)("marque-page du temps (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });

  // Un Monde d'essai par test : un Monde ne s'efface jamais, les noms sont donc uniques.
  async function mondeDEssai(): Promise<number> {
    const { rows } = await pool.query<{ id: number }>(
      "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
      [`essai-${randomUUID()}`, T0],
    );
    return rows[0].id;
  }

  it("garde, pour chaque Monde, l'instant jusqu'auquel il a été calculé", async () => {
    const id = await mondeDEssai();
    expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
  });

  it("avance après un calcul réussi, sur l'intervalle exact", async () => {
    const id = await mondeDEssai();
    const intervalles: [Date, Date][] = [];
    const resultat = await avancerMarquePage(pool, "monde", id, heures(10), async (_client, depuis, jusqua) => {
      intervalles.push([depuis, jusqua]);
    });
    expect(resultat).toEqual({ depuis: T0, jusqua: heures(10) });
    expect(intervalles).toEqual([[T0, heures(10)]]);
    expect(await lireMarquePage(pool, "monde", id)).toEqual(heures(10));
  });

  it("n'avance pas et n'enregistre rien si le calcul échoue", async () => {
    const id = await mondeDEssai();
    const avant = (await pool.query("select nom from monde where id = $1", [id])).rows[0].nom;
    await expect(
      avancerMarquePage(pool, "monde", id, heures(5), async (client) => {
        await client.query("update monde set nom = nom || '-modifie' where id = $1", [id]);
        throw new Error("calcul en panne");
      }),
    ).rejects.toThrow("calcul en panne");
    expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
    expect((await pool.query("select nom from monde where id = $1", [id])).rows[0].nom).toBe(avant);
  });

  it("ne recule jamais, même par une écriture directe en base", async () => {
    const id = await mondeDEssai();
    await avancerMarquePage(pool, "monde", id, heures(3), async () => {});
    expect(await avancerMarquePage(pool, "monde", id, heures(1), async () => {})).toBeNull();
    expect(await lireMarquePage(pool, "monde", id)).toEqual(heures(3));
    await expect(pool.query("update monde set calcule_jusqu_a = $2 where id = $1", [id, heures(1)])).rejects.toThrow(
      "Le temps ne recule jamais",
    );
  });

  it("ne compte pas deux fois le même temps quand deux rattrapages se croisent", async () => {
    const id = await mondeDEssai();
    let heuresCalculees = 0;
    const calcul = async (_client: unknown, depuis: Date, jusqua: Date) => {
      await new Promise((r) => setTimeout(r, 50));
      heuresCalculees += (jusqua.getTime() - depuis.getTime()) / 3_600_000;
    };
    await Promise.all([1, 2, 3].map(() => avancerMarquePage(pool, "monde", id, heures(12), calcul)));
    expect(heuresCalculees).toBe(12);
    expect(await lireMarquePage(pool, "monde", id)).toEqual(heures(12));
  });
});
