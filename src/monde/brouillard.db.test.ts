import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool, PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { cleDuNom } from "@/chefs/nom";
import { creerCompte } from "@/comptes/compte";
import { MIGRATIONS_FOLDER } from "@/db/migrations";
import { ABORDS_DU_FOYER_CASES } from "@/reglages";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { MONDE_DU_JEU, VERROU_DES_NAISSANCES } from "./bascule";
import { abordsDuFoyer, casesDecouvertes, decouvrir } from "./brouillard";
import { peutAccueillirUnFoyer } from "./foyers";
import { casesDesAnneaux, type Coordonnees, distance } from "./hex";

/** L'instruction de la migration US-0436 qui découvre les abords du Foyer des Territoires déjà nés. */
function abordsDesTerritoiresDejaNes(): string {
  return readFileSync(join(MIGRATIONS_FOLDER, "0045_brouillard.sql"), "utf8")
    .split("--> statement-breakpoint")
    .find((i) => /^INSERT INTO "case_decouverte"/m.test(i))!;
}

/** Des Cases rangées par q puis r, comme les rend casesDecouvertes. */
const rangees = (cases: Coordonnees[]) => [...cases].sort((a, b) => a.q - b.q || a.r - b.r);

describe.skipIf(!URL_TEST)("le brouillard (sur base)", () => {
  let pool: Pool;
  const lancement = `brouillard-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
  const nomUnique = () => `Bru${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  /** Un Territoire tout neuf, né comme dans le jeu. */
  const naitre = async () => {
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  /** Le Foyer du Territoire, et toutes les Cases de son Monde. */
  const sonMonde = async (base: Pool | PoolClient, territoireId: number) => {
    const { rows } = await base.query<{ foyer: Coordonnees; cases: Coordonnees[] }>(
      `select json_build_object('q', f.q, 'r', f.r) as foyer, json_agg(json_build_object('q', c.q, 'r', c.r)) as cases
       from territoire t join case_du_monde f on f.id = t.foyer_case_id join case_du_monde c on c.monde_id = f.monde_id
       where t.id = $1 group by f.q, f.r`,
      [territoireId],
    );
    return rows[0];
  };
  /** Ce que le Territoire doit avoir découvert : les Cases de son Monde à ABORDS_DU_FOYER_CASES Cases de son Foyer ou moins, comptées par distance. */
  const abordsAttendus = async (base: Pool | PoolClient, territoireId: number) => {
    const { foyer, cases } = await sonMonde(base, territoireId);
    return rangees(cases.filter((c) => distance(c, foyer) <= ABORDS_DU_FOYER_CASES));
  };

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  describe("les abords du Foyer, seuls découverts au départ (US-0436)", () => {
    it(`découvre à la naissance les Cases de son Monde à ${ABORDS_DU_FOYER_CASES} Cases du Foyer ou moins, le Foyer compris`, async () => {
      const territoireId = await naitre();
      const { foyer } = await sonMonde(pool, territoireId);
      const decouvertes = await casesDecouvertes(pool, territoireId);
      expect(decouvertes).toEqual(await abordsAttendus(pool, territoireId));
      expect(decouvertes).toContainEqual(foyer);
      // Sur la Couronne d'Aube, la seule partie du Monde en base, une bonne part des abords existe.
      expect(decouvertes.length).toBeGreaterThan(10);
      for (const c of decouvertes) expect(distance(c, foyer)).toBeLessThanOrEqual(ABORDS_DU_FOYER_CASES);
    });

    it("laisse toutes les autres Cases du Monde sous le brouillard : elles n'ont aucune ligne à lui", async () => {
      const territoireId = await naitre();
      const { cases } = await sonMonde(pool, territoireId);
      const { rows } = await pool.query<{ lignes: number; cachees: number }>(
        `select (select count(*)::int from case_decouverte where territoire_id = $1) as lignes,
           (select count(*)::int from case_du_monde c join case_du_monde f on f.monde_id = c.monde_id join territoire t on t.foyer_case_id = f.id
            where t.id = $1 and not exists (select 1 from case_decouverte d where d.territoire_id = t.id and d.case_id = c.id)) as cachees`,
        [territoireId],
      );
      const abords = (await abordsAttendus(pool, territoireId)).length;
      expect(rows[0]).toEqual({ lignes: abords, cachees: cases.length - abords });
    });

    it("les découvre aussi pour un chef né avant les Foyers, quand il reçoit le sien (US-0160)", async () => {
      const compte = await nouveauCompte();
      const nom = nomUnique();
      await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [compte.id, nom, cleDuNom(nom)]);
      const territoireId = (await naitreSurLaCouronne(pool, compte.id))!;
      expect(await casesDecouvertes(pool, territoireId)).toEqual(await abordsAttendus(pool, territoireId));
    });

    it("ne rend rien pour un Territoire inconnu", async () => {
      expect(await casesDecouvertes(pool, -1)).toEqual([]);
    });

    describe("les Territoires nés avant le brouillard (migration 0045)", () => {
      it("reçoivent par la migration les mêmes Cases que distance compte, ni plus ni moins, dans leur seul Monde", async () => {
        const client = await pool.connect();
        try {
          await client.query("begin");
          // Deux Mondes et des Territoires déjà nés, dans des tables temporaires qui masquent les vraies.
          await client.query("create temp table case_du_monde (id integer, monde_id integer, q integer, r integer) on commit drop");
          await client.query("create temp table territoire (id integer, foyer_case_id integer) on commit drop");
          await client.query("create temp table case_decouverte (territoire_id integer, case_id integer, primary key (territoire_id, case_id)) on commit drop");
          // Le premier Monde en entier, sur 12 Cases de rayon ; le second n'a que ses quatre Anneaux extérieurs, comme Aube sa Couronne.
          const premier = casesDesAnneaux(0, 12).map((c, i) => ({ id: i + 1, monde: 1, ...c }));
          const second = casesDesAnneaux(9, 12).map((c, i) => ({ id: 1001 + i, monde: 2, ...c }));
          const cases = [...premier, ...second];
          await client.query("insert into case_du_monde select * from unnest($1::int[], $2::int[], $3::int[], $4::int[])", [
            cases.map((c) => c.id),
            cases.map((c) => c.monde),
            cases.map((c) => c.q),
            cases.map((c) => c.r),
          ]);
          // Des Foyers au milieu, sur un bord, dans un coin, et à la limite des Anneaux absents.
          const foyers = [
            { q: 0, r: 0, monde: 1 },
            { q: 12, r: 0, monde: 1 },
            { q: -12, r: 12, monde: 1 },
            { q: 5, r: -9, monde: 1 },
            { q: -7, r: 3, monde: 1 },
            { q: 10, r: -10, monde: 2 },
            { q: -9, r: 0, monde: 2 },
          ];
          const caseDe = (f: (typeof foyers)[number]) => cases.find((c) => c.monde === f.monde && c.q === f.q && c.r === f.r)!;
          await client.query("insert into territoire select * from unnest($1::int[], $2::int[])", [foyers.map((_, i) => i + 1), foyers.map((f) => caseDe(f).id)]);

          await client.query(abordsDesTerritoiresDejaNes());
          const lire = async () =>
            (await client.query<{ territoire_id: number; case_id: number }>("select territoire_id, case_id from case_decouverte order by territoire_id, case_id")).rows;
          const decouvertes = await lire();
          const attendues = foyers.flatMap((f, i) =>
            cases
              .filter((c) => c.monde === f.monde && distance(c, f) <= ABORDS_DU_FOYER_CASES)
              .map((c) => ({ territoire_id: i + 1, case_id: c.id }))
              .sort((a, b) => a.case_id - b.case_id),
          );
          expect(decouvertes).toEqual(attendues);
          // Le Foyer du milieu a tous ses abords : un hexagone entier.
          expect(decouvertes.filter((d) => d.territoire_id === 1)).toHaveLength(1 + 3 * ABORDS_DU_FOYER_CASES * (ABORDS_DU_FOYER_CASES + 1));
          // Rejouée, elle ne change rien.
          await client.query(abordsDesTerritoiresDejaNes());
          expect(await lire()).toEqual(decouvertes);
        } finally {
          await client.query("rollback");
          client.release();
        }
      });

      it("donnent sur la vraie base, à un Territoire né sans brouillard, les abords de son Foyer et rien de plus, sans toucher aux autres", async () => {
        const [ancien, voisin] = [await naitre(), await naitre()];
        const client = await pool.connect();
        try {
          await client.query("begin");
          // Un Territoire né avant le brouillard : aucune Case découverte.
          await client.query("delete from case_decouverte where territoire_id = $1", [ancien]);
          expect(await casesDecouvertes(client, ancien)).toEqual([]);
          const avant = await casesDecouvertes(client, voisin);
          await client.query(abordsDesTerritoiresDejaNes());
          expect(await casesDecouvertes(client, ancien)).toEqual(await abordsAttendus(client, ancien));
          expect(await casesDecouvertes(client, voisin)).toEqual(avant);
        } finally {
          await client.query("rollback");
          client.release();
        }
      });

      it("comptent la même distance que le jeu : abordsDuFoyer et le SQL de la migration s'accordent sur chaque écart possible", async () => {
        // Chaque écart (dq, dr) d'un carré de 2 × 6 + 1 Cases de côté autour du Foyer, jugé par la formule de la migration.
        const { rows } = await pool.query<{ dq: number; dr: number; dedans: boolean }>(
          `select dq, dr, greatest(abs(dq), abs(dr), abs(dq + dr)) <= $1 as dedans
           from generate_series(-6, 6) dq cross join generate_series(-6, 6) dr order by dq, dr`,
          [ABORDS_DU_FOYER_CASES],
        );
        const foyer = { q: 3, r: -2 };
        const dedans = new Set(abordsDuFoyer(foyer).map((c) => `${c.q - foyer.q},${c.r - foyer.r}`));
        expect(rows).toHaveLength(169);
        for (const { dq, dr, dedans: selonLaBase } of rows) expect(selonLaBase, `${dq},${dr}`).toBe(dedans.has(`${dq},${dr}`));
        expect(abordsDesTerritoiresDejaNes()).toContain(`greatest(abs(c."q" - f."q"), abs(c."r" - f."r"), abs((c."q" - f."q") + (c."r" - f."r"))) <= ${ABORDS_DU_FOYER_CASES}`);
      });
    });
  });

  describe("un brouillard à chaque joueur (US-0440)", () => {
    /**
     * Un Territoire d'essai né sur la Case libre de prairie de la Couronne du Monde du jeu la plus éloignée de `loinDe`
     * (un autre Foyer), ou sur la première venue, à l'écart des autres Foyers ; il découvre les abords de son Foyer comme
     * à une naissance. Sous le verrou des naissances : aucune autre ne vise la même Case en même temps.
     */
    const naitreLoin = async (loinDe: Coordonnees | null) => {
      const compte = await nouveauCompte();
      const nom = nomUnique();
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select pg_advisory_xact_lock($1)", [VERROU_DES_NAISSANCES]);
        const { rows: libres } = await client.query<Coordonnees & { id: number; biome: string }>(
          `select id, q, r, biome_id as biome from case_du_monde where monde_id = ${MONDE_DU_JEU} and couronne and biome_id = 'prairie' and chef_id is null`,
        );
        const { rows: foyers } = await client.query<Coordonnees>(
          `select c.q, c.r from territoire t join case_du_monde c on c.id = t.foyer_case_id where c.monde_id = ${MONDE_DU_JEU}`,
        );
        const [choisie] = libres
          .filter((c) => peutAccueillirUnFoyer(c, foyers))
          .sort((a, b) => (loinDe ? distance(b, loinDe) - distance(a, loinDe) : 0) || a.id - b.id);
        const { rows } = await client.query<{ id: number }>(
          `with nouveau as (
             insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, ${MONDE_DU_JEU}, $2, $3) returning id
           ), prise as (
             update case_du_monde set chef_id = (select id from nouveau), imprenable = true where id = $4 and chef_id is null returning id
           )
           insert into territoire (chef_id, foyer_case_id) select nouveau.id, prise.id from nouveau, prise returning id`,
          [compte.id, nom, cleDuNom(nom), choisie.id],
        );
        await decouvrir(client, rows[0].id, abordsDuFoyer(choisie));
        await client.query("commit");
        return { territoireId: rows[0].id, foyer: { q: choisie.q, r: choisie.r } };
      } catch (erreur) {
        await client.query("rollback");
        throw erreur;
      } finally {
        client.release();
      }
    };
    /** Les Cases découvertes par le Territoire, chacune écrite « q,r ». */
    const cles = async (territoireId: number) => new Set((await casesDecouvertes(pool, territoireId)).map((c) => `${c.q},${c.r}`));

    it("est enregistré à part : une ligne par Territoire et par Case découverte, rien sur le Territoire ni sur la Case", async () => {
      const { rows: colonnes } = await pool.query<{ table_name: string; column_name: string }>(
        `select table_name, column_name from information_schema.columns
         where table_schema = 'public' and (table_name = 'case_decouverte' or table_name in ('territoire', 'case_du_monde') and column_name ~ 'decouv|brouill')
         order by table_name, ordinal_position`,
      );
      expect(colonnes).toEqual([
        { table_name: "case_decouverte", column_name: "territoire_id" },
        { table_name: "case_decouverte", column_name: "case_id" },
      ]);
      const { rows: cle } = await pool.query<{ colonnes: string[] }>(
        `select array_agg(a.attname::text order by array_position(k.conkey, a.attnum)) as colonnes from pg_constraint k
         join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any(k.conkey)
         where k.conrelid = 'case_decouverte'::regclass and k.contype = 'p'`,
      );
      expect(cle).toEqual([{ colonnes: ["territoire_id", "case_id"] }]);
    });

    it("deux joueurs aux Foyers éloignés ne voient pas les mêmes Cases : chacun les abords du sien", async () => {
      const premier = await naitreLoin(null);
      const second = await naitreLoin(premier.foyer);
      expect(distance(premier.foyer, second.foyer)).toBeGreaterThan(2 * ABORDS_DU_FOYER_CASES);
      const [siennes, autres] = [await cles(premier.territoireId), await cles(second.territoireId)];
      expect(siennes.size).toBeGreaterThan(0);
      expect(autres.size).toBeGreaterThan(0);
      expect([...siennes].filter((c) => autres.has(c))).toEqual([]);
      expect(await casesDecouvertes(pool, premier.territoireId)).toEqual(await abordsAttendus(pool, premier.territoireId));
      expect(await casesDecouvertes(pool, second.territoireId)).toEqual(await abordsAttendus(pool, second.territoireId));
    });

    it("une Case découverte par un joueur reste cachée pour les autres, même pour son voisin", async () => {
      const premier = await naitreLoin(null);
      const second = await naitreLoin(premier.foyer);
      // Un voisin, né comme dans le jeu, près du dernier arrivé : ses abords recouvrent en partie ceux du second.
      const voisin = await naitre();
      const avant = { second: await casesDecouvertes(pool, second.territoireId), voisin: await casesDecouvertes(pool, voisin) };
      // Le premier découvre le Foyer du second et ses abords, comme le fera une Expédition.
      expect(await decouvrir(pool, premier.territoireId, abordsDuFoyer(second.foyer))).toBe(avant.second.length);
      const siennes = await cles(premier.territoireId);
      for (const c of avant.second) expect(siennes.has(`${c.q},${c.r}`)).toBe(true);
      // Les autres n'en voient rien de plus.
      expect(await casesDecouvertes(pool, second.territoireId)).toEqual(avant.second);
      expect(await casesDecouvertes(pool, voisin)).toEqual(avant.voisin);
    });

    it("part avec son Territoire, et lui seul", async () => {
      const compte = await nouveauCompte();
      expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
      const parti = (await chefDuCompte(pool, compte.id))!.territoireId!;
      const reste = await naitre();
      const avant = await casesDecouvertes(pool, reste);
      expect((await casesDecouvertes(pool, parti)).length).toBeGreaterThan(0);
      await pool.query("delete from compte where id = $1", [compte.id]);
      const { rows } = await pool.query<{ n: number }>("select count(*)::int as n from case_decouverte where territoire_id = $1", [parti]);
      expect(rows[0].n).toBe(0);
      expect(await casesDecouvertes(pool, reste)).toEqual(avant);
    });
  });
});
