import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { rattraperLesAbsents } from "./absents";
import { definirAncre, maintenant } from "./horloge";
import { lireMarquePage } from "./marque-page";
import { rattraper } from "./rattraper";
import { SAUTS, sauterDansLeTemps } from "./sauter";
import { synchroniserHorloge } from "./synchroniser-horloge";

const R0 = new Date("2026-03-01T12:00:00Z").getTime();
const MINUTE = 60_000;

describe.skipIf(!URL_TEST)("temps accéléré (sur base)", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = poolDeTest();
  });
  beforeEach(async () => {
    // L'horloge de la base de test repart de zéro à chaque test.
    await pool.query("delete from horloge");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(R0);
  });
  afterEach(() => {
    vi.useRealTimers();
    definirAncre(null);
  });
  afterAll(async () => {
    await pool.query("delete from horloge");
    await pool.end();
  });

  it("fait passer le temps cent fois plus vite à ×100", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + MINUTE);
    expect(maintenant()).toEqual(new Date(R0 + 100 * MINUTE));
  });

  it("ne fait jamais reculer l'heure du jeu quand on change de vitesse", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + MINUTE);
    const avant = maintenant().getTime();
    await synchroniserHorloge(pool, 1); // retour à vitesse normale
    expect(maintenant().getTime()).toBeGreaterThanOrEqual(avant);
    vi.setSystemTime(R0 + 2 * MINUTE);
    expect(maintenant()).toEqual(new Date(R0 + 101 * MINUTE)); // une minute de plus, à vitesse normale
    await synchroniserHorloge(pool, 1); // même vitesse : rien ne bouge
    expect(maintenant()).toEqual(new Date(R0 + 101 * MINUTE));
  });

  it("reprend l'ancre enregistrée au redémarrage du serveur", async () => {
    await synchroniserHorloge(pool, 100);
    vi.setSystemTime(R0 + 3 * MINUTE);
    definirAncre(null); // un autre serveur qui démarre
    await synchroniserHorloge(pool, 100);
    expect(maintenant()).toEqual(new Date(R0 + 300 * MINUTE));
  });

  it("entraîne le rattrapage à l'ouverture d'une page et la tâche planifiée", async () => {
    await synchroniserHorloge(pool, 100);
    const ids: number[] = [];
    for (let i = 0; i < 2; i++) {
      const { rows } = await pool.query<{ id: number }>(
        "insert into monde (nom, calcule_jusqu_a) values ($1, $2) returning id",
        [`essai-${randomUUID()}`, new Date(R0)],
      );
      ids.push(rows[0].id);
    }
    vi.setSystemTime(R0 + MINUTE);
    await rattraper("monde", ids[0], { pool });
    await rattraperLesAbsents({ pool, parmi: { monde: [ids[1]] } });
    for (const id of ids) expect(await lireMarquePage(pool, "monde", id)).toEqual(new Date(R0 + 100 * MINUTE));
  });

  describe("saut dans le temps (US-0038) et production en temps accéléré (US-0218)", () => {
    const lancement = `vitesse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let numero = 0;
    const HEURE = 60 * MINUTE;

    /** Un Foyer né à l'heure du jeu, ses Stocks remis à zéro. */
    const naitre = async () => {
      const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
      expect(await enregistrerNomDeChef(pool, compte.id, `Vite${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[numero % 10]}`)).toMatchObject({ statut: "enregistre" });
      const territoireId = (await chefDuCompte(pool, compte.id))!.territoireId!;
      await pool.query("update stock set quantite = 0 where territoire_id = $1", [territoireId]);
      return territoireId;
    };
    const stocks = async (territoireId: number) =>
      Object.fromEntries((await pool.query<{ id: string; q: string }>("select ressource_id as id, quantite::text as q from stock where territoire_id = $1", [territoireId])).rows.map((r) => [r.id, r.q]));
    const nFois = async (n: number) =>
      Object.fromEntries((await pool.query<{ id: string; q: string }>("select ressource_id as id, (par_heure * $1)::numeric(24, 6)::text as q from production_biome where biome_id = 'prairie'", [n])).rows.map((r) => [r.id, r.q]));

    beforeAll(async () => {
      await preparerMondeDeTest(pool);
    });
    afterAll(async () => {
      await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    });

    it("avance l'heure du jeu d'un bloc, sans changer sa vitesse", async () => {
      await synchroniserHorloge(pool, 100);
      vi.setSystemTime(R0 + MINUTE);
      await sauterDansLeTemps(pool, SAUTS.jour);
      expect(maintenant()).toEqual(new Date(R0 + 100 * MINUTE + 24 * HEURE));
      vi.setSystemTime(R0 + 2 * MINUTE);
      expect(maintenant()).toEqual(new Date(R0 + 200 * MINUTE + 24 * HEURE));
      definirAncre(null); // un autre serveur qui démarre retrouve le saut
      await synchroniserHorloge(pool, 100);
      expect(maintenant()).toEqual(new Date(R0 + 200 * MINUTE + 24 * HEURE));
    });

    it("refuse de sauter en production", async () => {
      await expect(sauterDansLeTemps(pool, SAUTS.heure, { VERCEL_ENV: "production" })).rejects.toThrow("pas en production");
    });

    it("à ×100, ajoute une heure de production toutes les 36 secondes réelles", async () => {
      await synchroniserHorloge(pool, 100);
      const territoireId = await naitre();
      vi.setSystemTime(R0 + 36_000);
      await rattraper("territoire", territoireId, { pool });
      expect(await stocks(territoireId)).toEqual(await nFois(1));
    });

    it("après un saut d'un jour, ajoute exactement 24 fois la production horaire", async () => {
      await synchroniserHorloge(pool, 1);
      const territoireId = await naitre();
      await sauterDansLeTemps(pool, SAUTS.jour);
      await rattraper("territoire", territoireId, { pool });
      expect(await stocks(territoireId)).toEqual(await nFois(24));
    });
  });
});

