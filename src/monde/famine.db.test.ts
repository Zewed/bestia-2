import type { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { rattraperLesAbsents } from "@/temps/absents";
import { definirAncre } from "@/temps/horloge";
import { lireMarquePage } from "@/temps/marque-page";
import { rattraper } from "@/temps/rattraper";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { famineDepuis } from "./famine";
import { fixerStock } from "./stocks";

const HEURE = 3_600_000;
const MINUTE = 60_000;
/** Une heure, en microsecondes : la plus petite durée du jeu est la microseconde. */
const HEURE_US = 3_600_000_000;

describe.skipIf(!URL_TEST)("la Famine, tenue par le mécanisme du temps (US-0325, sur base)", () => {
  let pool: Pool;
  const lancement = `famine-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  /**
   * Un Territoire tout neuf en prairie (Viande +8, Végétaux +14 par heure), ses `habitants` Habitants, sa Viande et
   * ses Végétaux réglés à la main ; et l'instant de sa naissance, d'où partent les essais.
   */
  const naitre = async (habitants: number, viande: string, vegetaux: string) => {
    const n = ++numero;
    const compte = (await creerCompte(pool, `${lancement}-${n}@essai.test`, "une phrase de passe"))!;
    const nom = `Fain${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[n % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom)).toMatchObject({ statut: "enregistre" });
    const territoireId = (await chefDuCompte(pool, compte.id))!.territoireId!;
    await pool.query(
      `update stock set quantite = case ressource_id when 'viande' then $2::numeric else $3::numeric end, reste = 0, plein_depuis = null
       where territoire_id = $1 and ressource_id in ('viande', 'vegetaux')`,
      [territoireId, viande, vegetaux],
    );
    await pool.query(
      "with partis as (delete from habitant where territoire_id = $1) insert into habitant (territoire_id, prenom) select $1, 'Essai' from generate_series(1, $2)",
      [territoireId, habitants],
    );
    return { territoireId, ne: await lireMarquePage(pool, "territoire", territoireId) };
  };
  /**
   * Vingt Habitants (40 d'Entretien) : la Viande, à 8 − 20 = −12 par heure, se vide en 6 h ; les Végétaux, à
   * 288 − 6 × 6 = 252, paient alors 32 et en produisent 14 : 14 h de plus. La Nourriture paie l'Entretien pendant
   * 20 h tout juste : la Famine commence 20 h après la naissance, à la microseconde.
   */
  const vingtHeures = () => naitre(20, "72", "288");
  /** L'instant où la Famine a commencé, en microsecondes après `ne` ; null hors Famine. */
  const debut = async (territoireId: number, ne: Date) =>
    (
      await pool.query<{ debut: string | null }>(
        "select (extract(epoch from famine_depuis - $2::timestamptz) * 1000000)::bigint::text as debut from territoire where id = $1",
        [territoireId, ne],
      )
    ).rows[0].debut;
  const apres = (ne: Date, ms: number) => new Date(ne.getTime() + ms);
  /** 20 heures, en microsecondes. */
  const VINGT_HEURES = String(20 * HEURE_US);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterEach(() => {
    vi.useRealTimers();
    definirAncre(null);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  describe("entrer en Famine (US-0325)", () => {
    it("commence à l'heure exacte où la Nourriture ne suffit plus à payer l'Entretien, pas avant", async () => {
      const t = await vingtHeures();
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 20 * HEURE - 1) });
      expect(await debut(t.territoireId, t.ne)).toBeNull();
      expect(await famineDepuis(pool, t.territoireId)).toBeNull();
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 20.5 * HEURE) });
      expect(await debut(t.territoireId, t.ne)).toBe(VINGT_HEURES);
      // Depuis 30 min, à l'instant jusqu'où le Territoire est calculé.
      expect(await famineDepuis(pool, t.territoireId)).toBe(0.5);
    });

    it("ne commence que quand la Viande et les Végétaux ensemble ne suffisent plus : la Viande vide, les Végétaux paient tout", async () => {
      const t = await vingtHeures();
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 19 * HEURE) });
      const { rows } = await pool.query<{ ressource_id: string; quantite: string }>(
        "select ressource_id, quantite::text from stock where territoire_id = $1 and ressource_id in ('viande', 'vegetaux') order by ressource_id",
        [t.territoireId],
      );
      expect(rows).toEqual([
        { ressource_id: "vegetaux", quantite: "18.000000" },
        { ressource_id: "viande", quantite: "0.000000" },
      ]);
      expect(await debut(t.territoireId, t.ne)).toBeNull();
    });

    it("page ouverte : le même instant, quel que soit le découpage du temps, gardé tant qu'elle dure", async () => {
      const t = await vingtHeures();
      for (let ms = 17 * MINUTE + 3_123; ms < 20.9 * HEURE; ms += 17 * MINUTE + 3_123) {
        await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, ms) });
        expect(await debut(t.territoireId, t.ne), `${ms / MINUTE} min`).toBe(ms < 20 * HEURE ? null : VINGT_HEURES);
      }
    }, 60_000);

    it("tâche planifiée passée au milieu : le même instant qu'à la page fermée", async () => {
      const t = await vingtHeures();
      for (const heures of [3.5, 12.25, 19.99, 20.1]) {
        const passage = await rattraperLesAbsents({ pool, maintenant: apres(t.ne, heures * HEURE), parmi: { territoire: [t.territoireId] } });
        expect(passage, `passage à ${heures} h`).toMatchObject({ rattrapes: 1, echecs: 0 });
      }
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 20.75 * HEURE) });
      expect(await debut(t.territoireId, t.ne)).toBe(VINGT_HEURES);
    });

    it("à ×100, commence à son instant de jeu exact, 720 secondes réelles après la naissance", async () => {
      const t = await vingtHeures();
      const reel = new Date("2026-03-01T12:00:00Z").getTime();
      vi.useFakeTimers({ toFake: ["Date"] });
      definirAncre({ facteur: 100, reel, jeu: t.ne.getTime() });
      vi.setSystemTime(reel + 720_000 - 1);
      await rattraper("territoire", t.territoireId, { pool });
      expect(await debut(t.territoireId, t.ne)).toBeNull();
      vi.setSystemTime(reel + 720_000 + 1);
      await rattraper("territoire", t.territoireId, { pool });
      expect(await debut(t.territoireId, t.ne)).toBe(VINGT_HEURES);
    });

    it("un Territoire déjà en Famine, sans état, la reçoit à son premier rattrapage : depuis le marque-page d'où il part", async () => {
      const t = await naitre(20, "0", "0");
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 30 * MINUTE) });
      expect(await debut(t.territoireId, t.ne)).toBe("0");
      expect(await famineDepuis(pool, t.territoireId)).toBe(0.5);
    });

    it("commence dès le premier pas quand les deux Stocks sont vides, même si l'un produit sa moitié de l'Entretien", async () => {
      // Douze Habitants (24 d'Entretien) : les Végétaux produisent 14, plus que leur moitié, mais la Viande ne donne que
      // ses 8 : 22 en tout, il en manque 2 dès le premier pas.
      const t = await naitre(12, "0", "0");
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 30 * MINUTE) });
      expect(await debut(t.territoireId, t.ne)).toBe("0");
    });

    it("s'arrête dès que la Nourriture paie de nouveau l'Entretien", async () => {
      const t = await vingtHeures();
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 20.5 * HEURE) });
      expect(await debut(t.territoireId, t.ne)).toBe(VINGT_HEURES);
      expect(await fixerStock(pool, t.territoireId, "vegetaux", "1000")).not.toBeNull();
      await rattraper("territoire", t.territoireId, { pool, jusqua: apres(t.ne, 20.5 * HEURE + 1) });
      expect(await debut(t.territoireId, t.ne)).toBeNull();
      expect(await famineDepuis(pool, t.territoireId)).toBeNull();
    });
  });
});
