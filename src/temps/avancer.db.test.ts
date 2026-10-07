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

  describe("un événement qui en programme un autre (US-0331 : une arrivée programme la suivante)", () => {
    // « relancer » relève son instant et programme le suivant trois heures plus tard, sur le même élément ;
    // il programme aussi, au même instant, un « noter » sur un autre élément, qui n'a pas à suivre.
    function relances(autre: number) {
      const essai = compteurDEssai();
      const regles: Regles = {
        ...essai.regles,
        evenements: {
          ...essai.regles.evenements,
          relancer: async (client, id, evenement) => {
            await essai.regles.evenements!.noter(client, id, evenement);
            const suivant = new Date(evenement.survientLe.getTime() + 3 * 3_600_000);
            await programmerEvenement(client, "monde", id, suivant, "relancer");
            await programmerEvenement(client, "monde", autre, suivant, "noter");
          },
        },
      };
      return { ...essai, regles };
    }
    const instants = async (id: number) =>
      (await pool.query<{ type: string; survient_le: Date; traite_le: Date | null }>(
        "select type, survient_le, traite_le from evenement where element = 'monde' and element_id = $1 order by survient_le, id",
        [id],
      )).rows.map((e) => [e.type, duree(T0, e.survient_le), e.traite_le && duree(T0, e.traite_le)]);

    it("l'applique dans la même avancée, à son instant exact et à son rang parmi les autres", async () => {
      const autre = await mondeDEssai();
      const { releves, regles } = relances(autre);
      const id = await mondeDEssai();
      await programmerEvenement(pool, "monde", id, heures(1), "relancer");
      await programmerEvenement(pool, "monde", id, heures(5), "noter");

      const resultat = await avancer(pool, "monde", id, regles, heures(10));
      expect(resultat?.evenements).toBe(5);
      // Relancé à 1 h, puis à 4 h, avant le relevé de 5 h déjà programmé, puis à 7 h et à 10 h, la fin comprise.
      expect(releves.filter((r) => r.id === id).map((r) => [r.heure, Math.round(r.stock)])).toEqual([
        [1, 10],
        [4, 40],
        [5, 50],
        [7, 70],
        [10, 100],
      ]);
      expect(await instants(id)).toEqual([
        ["relancer", 1, 1],
        ["relancer", 4, 4],
        ["noter", 5, 5],
        ["relancer", 7, 7],
        ["relancer", 10, 10],
        ["relancer", 13, null],
      ]);
      // Ce qui est programmé sur un autre élément attend que celui-ci avance à son tour.
      expect(releves.filter((r) => r.id === autre)).toEqual([]);
      expect((await instants(autre)).map(([, , traite]) => traite)).toEqual([null, null, null, null]);
    });

    it("donne la même suite en une avancée qu'en avançant d'heure en heure", async () => {
      const autre = await mondeDEssai();
      const dUnCoup = relances(autre);
      const parHeure = relances(autre);
      const [a, b] = [await mondeDEssai(), await mondeDEssai()];
      for (const id of [a, b]) await programmerEvenement(pool, "monde", id, heures(1), "relancer");

      await avancer(pool, "monde", a, dUnCoup.regles, heures(10));
      for (let h = 1; h <= 10; h++) await avancer(pool, "monde", b, parHeure.regles, heures(h));

      expect(dUnCoup.releves.map((r) => r.heure)).toEqual([1, 4, 7, 10]);
      expect(parHeure.releves.map((r) => r.heure)).toEqual([1, 4, 7, 10]);
      expect(dUnCoup.stock.get(a)).toBeCloseTo(100, 9);
      expect(parHeure.stock.get(b)).toBeCloseTo(100, 9);
      expect(await instants(a)).toEqual(await instants(b));
    });
  });

  describe("la conclusion d'une avancée (US-0337 : un seul Récit pour plusieurs départs)", () => {
    /** Les règles du compteur, et chaque conclusion : les événements appliqués, type et heure de leur instant. */
    function conclusions() {
      const essai = compteurDEssai();
      const conclues: { id: number; appliques: [string, number][]; stock: number }[] = [];
      const regles: Regles = {
        ...essai.regles,
        evenements: {
          ...essai.regles.evenements,
          // Programme un « noter » une heure plus tard, que la même avancée applique si elle va jusque-là.
          relancer: async (client, id, evenement) => {
            await programmerEvenement(client, "monde", id, new Date(evenement.survientLe.getTime() + 3_600_000), "noter");
          },
        },
        conclure: async (_client, id, appliques) => {
          conclues.push({ id, appliques: appliques.map((e) => [e.type, duree(T0, e.survientLe)]), stock: essai.stock.get(id) ?? 0 });
        },
      };
      return { ...essai, regles, conclues };
    }

    it("vient une fois, à la fin de l'avancée, avec tous les événements qu'elle a appliqués, dans leur ordre et à leur instant", async () => {
      const { regles, conclues } = conclusions();
      const id = await mondeDEssai();
      for (const [h, type] of [[5, "noter"], [2, "relancer"], [7, "prelevement"], [12, "noter"]] as const) await programmerEvenement(pool, "monde", id, heures(h), type);

      await avancer(pool, "monde", id, regles, heures(10));
      // Le « noter » programmé en chemin, à 3 h, en fait partie ; celui de 12 h, au-delà de la fin, attend.
      expect(conclues).toEqual([
        {
          id,
          appliques: [
            ["relancer", 2],
            ["noter", 3],
            ["noter", 5],
            ["prelevement", 7],
          ],
          // L'évolution jusqu'à la fin est faite : 70, divisé par deux à 7 h, puis 30 de plus.
          stock: 65,
        },
      ]);
    });

    it("vient à chaque avancée, avec ses seuls événements : aucun n'est conclu deux fois", async () => {
      const { regles, conclues } = conclusions();
      const id = await mondeDEssai();
      for (const h of [1, 4, 9]) await programmerEvenement(pool, "monde", id, heures(h), "noter");

      for (const h of [4, 6, 10]) await avancer(pool, "monde", id, regles, heures(h));
      expect(conclues.map((c) => c.appliques)).toEqual([
        [
          ["noter", 1],
          ["noter", 4],
        ],
        [],
        [["noter", 9]],
      ]);
    });

    it("donne à un événement d'avant le marque-page l'instant où il a été appliqué : celui du marque-page", async () => {
      const { regles, conclues } = conclusions();
      const id = await mondeDEssai();
      await pool.query("update monde set calcule_jusqu_a = $2 where id = $1", [id, heures(3)]);
      await programmerEvenement(pool, "monde", id, heures(1), "noter");

      await avancer(pool, "monde", id, regles, heures(5));
      expect(conclues.map((c) => c.appliques)).toEqual([[["noter", 3]]]);
    });

    it("n'enregistre rien si la conclusion échoue : ni les événements, ni le marque-page", async () => {
      const { regles } = conclusions();
      const id = await mondeDEssai();
      const evenement = await programmerEvenement(pool, "monde", id, heures(2), "noter");
      const echoue: Regles = {
        ...regles,
        conclure: async () => {
          throw new Error("Conclusion impossible.");
        },
      };

      await expect(avancer(pool, "monde", id, echoue, heures(4))).rejects.toThrow("Conclusion impossible.");
      expect(await lireMarquePage(pool, "monde", id)).toEqual(T0);
      const { rows } = await pool.query("select traite_le from evenement where id = $1", [evenement]);
      expect(rows[0].traite_le).toBeNull();
    });
  });
});
