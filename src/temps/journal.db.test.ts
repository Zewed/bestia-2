import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { dernierPassage, journaliserPassage } from "./absents";

describe.skipIf(!URL_TEST)("journal de la tâche planifiée (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });

  it("note l'heure, la durée, les éléments avancés et les erreurs de chaque passage", async () => {
    // Une date lointaine et toujours plus tardive d'un lancement à l'autre : la base de
    // test garde les passages des lancements précédents.
    const debut = new Date(Date.UTC(3000, 0, 1) + Date.now());
    await journaliserPassage(pool, debut, {
      rattrapes: 12,
      echecs: 1,
      restants: 3,
      dureeMs: 840,
      erreurs: [{ element: "monde", id: 7, raison: "panne d'essai" }],
    });
    const { rows } = await pool.query("select * from passage_tache where debut = $1", [debut]);
    expect(rows[0]).toMatchObject({
      duree_ms: 840,
      rattrapes: 12,
      echecs: 1,
      restants: 3,
      erreurs: [{ element: "monde", id: 7, raison: "panne d'essai" }],
    });
    expect(await dernierPassage(pool)).toEqual(debut);
  });

  it("garde les passages des 7 derniers jours et efface les plus anciens", async () => {
    const vide = { rattrapes: 0, echecs: 0, restants: 0, dureeMs: 1, erreurs: [] };
    const ancien = new Date("2030-02-01T00:00:00Z");
    const recent = new Date("2030-02-05T00:00:00Z");
    await journaliserPassage(pool, ancien, vide);
    await journaliserPassage(pool, recent, vide);
    await journaliserPassage(pool, new Date("2030-02-09T00:00:00Z"), vide);
    const restent = await pool.query("select debut from passage_tache where debut in ($1, $2)", [ancien, recent]);
    expect(restent.rows.map((r) => r.debut)).toEqual([recent]);
  });
});
