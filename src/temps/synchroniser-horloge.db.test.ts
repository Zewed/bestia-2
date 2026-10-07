import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { stocksDuTerritoire } from "@/monde/stocks";
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

    /** Un Foyer né à l'heure du jeu, ses Stocks remis à zéro et sans Habitants : la production seule, sans Entretien (US-0316). */
    const naitre = async () => {
      const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
      expect(await enregistrerNomDeChef(pool, compte.id, `Vite${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`)).toMatchObject({ statut: "enregistre" });
      const territoireId = (await chefDuCompte(pool, compte.id))!.territoireId!;
      await pool.query("update stock set quantite = 0 where territoire_id = $1", [territoireId]);
      await pool.query("delete from habitant where territoire_id = $1", [territoireId]);
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

    describe("la limite en temps accéléré (US-0232)", () => {
      /** Le Bois est placé à N unités de sa limite. */
      const N = 2;

      /** Chaque Stock du Territoire, tel qu'il est en base : quantité, limite et reste exacts, et l'instant où il est devenu plein. */
      const etats = async (territoireId: number) =>
        Object.fromEntries(
          (
            await pool.query<{ id: string; q: string; limite: string; reste: string; plein_depuis: Date | null }>(
              "select ressource_id as id, quantite::text as q, limite::text as limite, reste::text as reste, plein_depuis from stock where territoire_id = $1",
              [territoireId],
            )
          ).rows.map((s) => [s.id, s]),
        );
      /** Ce qu'une Case de prairie produit par heure, tel que la base le tient de donnees/biomes.yaml. */
      const prairie = async () =>
        Object.fromEntries(
          (await pool.query<{ id: string; par_heure: string }>("select ressource_id as id, par_heure from production_biome where biome_id = 'prairie'")).rows.map(
            (p) => [p.id, Number(p.par_heure)],
          ),
        );
      /** Le Stock est devenu plein à l'instant de jeu attendu, à la seconde près. */
      const pleinA = (pleinDepuis: Date | null, attendu: number) => {
        expect(pleinDepuis).not.toBeNull();
        expect(Math.abs(pleinDepuis!.getTime() - attendu)).toBeLessThan(1000);
      };

      it("à ×100, un Stock proche de sa limite l'atteint à l'instant prévu et s'y arrête", async () => {
        await synchroniserHorloge(pool, 100);
        const territoireId = await naitre();
        await pool.query("update stock set quantite = limite - $2 where territoire_id = $1 and ressource_id = 'bois'", [territoireId, N]);
        const depuis = (await lireMarquePage(pool, "territoire", territoireId)).getTime();
        // Les N unités manquantes viennent en N / par_heure heures de jeu, soit cent fois moins de temps réel.
        const duree = (N / (await prairie()).bois) * HEURE;
        const reel = R0 + duree / 100;

        // Une seconde réelle avant (cent secondes de jeu) : encore sous la limite.
        vi.setSystemTime(reel - 1000);
        await rattraper("territoire", territoireId, { pool });
        const avant = (await etats(territoireId)).bois;
        expect(Number(avant.q)).toBeLessThan(Number(avant.limite));
        expect(avant.plein_depuis).toBeNull();

        // Une seconde réelle après : exactement la limite, pleine depuis l'instant prévu.
        vi.setSystemTime(reel + 1000);
        await rattraper("territoire", territoireId, { pool });
        const apres = (await etats(territoireId)).bois;
        expect(apres.q).toBe(apres.limite);
        expect(Number(apres.reste)).toBe(0);
        pleinA(apres.plein_depuis, depuis + duree);

        // Dix minutes réelles plus tard, plus de seize heures de jeu : le Bois ne bouge plus.
        vi.setSystemTime(reel + 10 * MINUTE);
        await rattraper("territoire", territoireId, { pool });
        expect((await etats(territoireId)).bois).toEqual(apres);
      });

      it("page fermée tout ce temps, la réouverture montre le Stock exactement à sa limite, plein", async () => {
        await synchroniserHorloge(pool, 100);
        const territoireId = await naitre();
        await pool.query("update stock set quantite = limite - $2 where territoire_id = $1 and ressource_id = 'bois'", [territoireId, N]);
        const depuis = (await lireMarquePage(pool, "territoire", territoireId)).getTime();
        const duree = (N / (await prairie()).bois) * HEURE;

        // Aucun rattrapage pendant dix minutes réelles, plus de seize heures de jeu ; puis la page se rouvre.
        vi.setSystemTime(R0 + 10 * MINUTE);
        await rattraper("territoire", territoireId, { pool });
        expect(await lireMarquePage(pool, "territoire", territoireId)).toEqual(new Date(R0 + 1000 * MINUTE));
        // Ce que lit la page : la quantité égale la limite, et la barre signale « plein » dès quantité ≥ limite.
        const bois = (await stocksDuTerritoire(pool, territoireId)).find((s) => s.id === "bois")!;
        expect(bois.quantite).toBe(bois.limite);
        const etat = (await etats(territoireId)).bois;
        expect(Number(etat.reste)).toBe(0);
        pleinA(etat.plein_depuis, depuis + duree);
      });

      it("après un saut d'une semaine depuis la page de contrôle, chaque Stock vaut exactement sa limite", async () => {
        await synchroniserHorloge(pool, 100);
        const territoireId = await naitre();
        // Chaque Stock à mi-chemin de sa limite : une semaine de prairie la dépasse pour les quatre.
        await pool.query("update stock set quantite = limite / 2 where territoire_id = $1", [territoireId]);
        const depart = await etats(territoireId);
        const parHeure = await prairie();
        const depuis = (await lireMarquePage(pool, "territoire", territoireId)).getTime();

        await sauterDansLeTemps(pool, SAUTS.semaine);
        await rattraper("territoire", territoireId, { pool });
        const apres = await etats(territoireId);
        expect(Object.keys(apres).sort()).toEqual(["bois", "pierre", "vegetaux", "viande"]);
        for (const [id, stock] of Object.entries(apres)) {
          expect(stock.q, id).toBe(stock.limite);
          expect(Number(stock.reste), id).toBe(0);
          pleinA(stock.plein_depuis, depuis + ((Number(stock.limite) - Number(depart[id].q)) / parHeure[id]) * HEURE);
        }
      });
    });
  });
});

