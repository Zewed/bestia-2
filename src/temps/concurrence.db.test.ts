import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { rattraperLesAbsents } from "./absents";
import { avancer, programmerEvenement, type Regles } from "./avancer";
import { lireMarquePage } from "./marque-page";
import { rattraper } from "./rattraper";

const T0 = new Date("2026-01-01T00:00:00Z");
const heures = (n: number) => new Date(T0.getTime() + n * 3_600_000);

// Des règles qui comptent tout ce qu'elles font, et qui prennent leur temps pour que
// les rattrapages simultanés se chevauchent vraiment.
function reglesComptables() {
  const compte = { heures: 0, attaques: 0 };
  const regles: Regles = {
    evoluer: async (_client, _id, depuis, jusqua) => {
      await new Promise((r) => setTimeout(r, 30));
      compte.heures += (jusqua.getTime() - depuis.getTime()) / 3_600_000;
    },
    evenements: {
      attaque: async () => {
        await new Promise((r) => setTimeout(r, 30));
        compte.attaques += 1;
      },
    },
  };
  return { compte, regles };
}

describe.skipIf(!URL_TEST)("ne jamais compter deux fois le même temps (sur base)", () => {
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

  it("applique une seule fois l'événement que plusieurs rattrapages simultanés traversent", async () => {
    const { compte, regles } = reglesComptables();
    const id = await mondeDEssai();
    await programmerEvenement(pool, "monde", id, heures(3), "attaque");
    await Promise.all([1, 2, 3, 4].map(() => avancer(pool, "monde", id, regles, heures(8))));
    expect(compte).toEqual({ heures: 8, attaques: 1 });
    expect(await lireMarquePage(pool, "monde", id)).toEqual(heures(8));
  });

  it("donne en parallèle le même résultat qu'un seul rattrapage", async () => {
    const seul = reglesComptables();
    const parallele = reglesComptables();
    const [a, b] = [await mondeDEssai(), await mondeDEssai()];
    for (const id of [a, b]) await programmerEvenement(pool, "monde", id, heures(5), "attaque");
    await avancer(pool, "monde", a, seul.regles, heures(9));
    await Promise.all([heures(9), heures(6), heures(9), heures(2)].map((t) => avancer(pool, "monde", b, parallele.regles, t)));
    expect(parallele.compte).toEqual(seul.compte);
  });

  it("partage le même verrou entre la tâche planifiée et l'ouverture d'une page", async () => {
    const { compte, regles } = reglesComptables();
    const id = await mondeDEssai();
    await programmerEvenement(pool, "monde", id, heures(4), "attaque");
    // La tâche passe à H+9 pendant qu'un joueur ouvre la page à H+10, au même moment.
    await Promise.all([
      rattraperLesAbsents({ pool, maintenant: heures(9), parmi: { monde: [id] }, regles }),
      rattraper("monde", id, { pool, regles, jusqua: heures(10) }),
    ]);
    expect(compte).toEqual({ heures: 10, attaques: 1 });
    expect(await lireMarquePage(pool, "monde", id)).toEqual(heures(10));
  });
});
