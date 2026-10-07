import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { cleDuNom } from "@/chefs/nom";
import { creerCompte } from "@/comptes/compte";
import { MIGRATIONS_FOLDER } from "@/db/migrations";
import { lireJeu } from "@/donnees/charger";
import { PRENOMS } from "@/donnees/jeux";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { habitantsDuTerritoire, nombreDHabitants } from "./habitants";

/** L'instruction de la migration US-0303 qui nomme les Habitants déjà là. */
function nommerLesHabitantsDejaLa(): string {
  const instructions = readdirSync(MIGRATIONS_FOLDER)
    .filter((f) => f.endsWith(".sql"))
    .flatMap((f) => readFileSync(join(MIGRATIONS_FOLDER, f), "utf8").split("--> statement-breakpoint"));
  return instructions.find((i) => /^\s*WITH "rangs"/m.test(i) && i.includes('UPDATE "habitant" SET "prenom"'))!;
}

describe.skipIf(!URL_TEST)("les premiers Habitants (US-0301, US-0303, sur base)", () => {
  let pool: Pool;
  const lancement = `habitants-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
  const nomUnique = () => `Hab${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[Math.floor(numero / 10) % 10]}${"abcdefghij"[numero % 10]}`;
  const habitants = async (territoireId: number) =>
    (await pool.query<{ id: number; metier: string | null }>("select id, metier from habitant where territoire_id = $1 order by id", [territoireId])).rows;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("donne trois Habitants sans Métier à un joueur qui vient de naître", async () => {
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const territoireId = (await chefDuCompte(pool, compte.id))!.territoireId!;
    const siens = await habitants(territoireId);
    expect(siens).toHaveLength(3);
    expect(siens.map((h) => h.metier)).toEqual([null, null, null]);
  });

  it("les donne aussi au chef né avant la Couronne, quand il reçoit son Foyer", async () => {
    const compte = await nouveauCompte();
    const nom = nomUnique();
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [compte.id, nom, cleDuNom(nom)]);
    const territoireId = await naitreSurLaCouronne(pool, compte.id);
    expect(await habitants(territoireId!)).toHaveLength(3);
  });

  it("garde les Habitants de chacun pour lui seul, et les retire avec son Territoire", async () => {
    const a = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, a.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const b = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, b.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const [ta, tb] = [(await chefDuCompte(pool, a.id))!.territoireId!, (await chefDuCompte(pool, b.id))!.territoireId!];
    const [ha, hb] = [await habitants(ta), await habitants(tb)];
    expect(ha).toHaveLength(3);
    expect(hb).toHaveLength(3);
    expect(ha.some((h) => hb.some((x) => x.id === h.id))).toBe(false);
    await pool.query("delete from compte where id = $1", [a.id]);
    expect(await habitants(ta)).toEqual([]);
  });

  it("rend à la page Habitants ceux du Territoire, et aucun autre (US-0302)", async () => {
    const a = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, a.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const b = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, b.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const [ta, tb] = [(await chefDuCompte(pool, a.id))!.territoireId!, (await chefDuCompte(pool, b.id))!.territoireId!];
    const siens = await habitantsDuTerritoire(pool, ta);
    expect(siens.map((h) => h.id).sort()).toEqual((await habitants(ta)).map((h) => h.id).sort());
    expect(siens.map((h) => h.metier)).toEqual([null, null, null]);
    expect(siens.every((h) => h.arriveLe instanceof Date)).toBe(true);
    const autres = new Set((await habitantsDuTerritoire(pool, tb)).map((h) => h.id));
    expect(siens.some((h) => autres.has(h.id))).toBe(false);
    expect(await habitantsDuTerritoire(pool, -1)).toEqual([]);
  });

  it("donne à chacun des trois un prénom tiré de la liste, trois prénoms différents (US-0303)", async () => {
    const liste = lireJeu(PRENOMS).map((p) => p.nom);
    const tirages = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const compte = await nouveauCompte();
      expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
      const prenoms = (await habitantsDuTerritoire(pool, (await chefDuCompte(pool, compte.id))!.territoireId!)).map((h) => h.prenom);
      expect(prenoms).toHaveLength(3);
      expect(new Set(prenoms).size).toBe(3);
      for (const p of prenoms) {
        expect(liste).toContain(p);
        tirages.add(p);
      }
    }
    // Tirés au hasard : quatre naissances ne redonnent pas toutes les trois mêmes prénoms.
    expect(tirages.size).toBeGreaterThan(3);
  });

  it("n'a aucun Habitant sans prénom, et la base refuse d'en créer un", async () => {
    expect((await pool.query("select count(*)::int as n from habitant where prenom is null")).rows[0].n).toBe(0);
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const t = (await chefDuCompte(pool, compte.id))!.territoireId!;
    await expect(pool.query("insert into habitant (territoire_id) values ($1)", [t])).rejects.toMatchObject({ code: "23502" });
  });

  it("nomme, à la migration, les Habitants déjà là : chacun un prénom de la liste, sans doublon dans un Territoire", async () => {
    const liste = lireJeu(PRENOMS).map((p) => p.nom);
    const client = await pool.connect();
    try {
      await client.query("begin");
      // Des Habitants encore sans prénom, comme avant la migration, dans une table temporaire qui masque la vraie.
      await client.query("create temp table habitant (id integer, territoire_id integer, prenom text) on commit drop");
      await client.query(`insert into habitant (id, territoire_id) select n, 1 + (n - 1) / 3 from generate_series(1, 30) n`);
      await client.query(nommerLesHabitantsDejaLa());
      const { rows } = await client.query<{ territoire_id: number; prenoms: string[] }>(
        "select territoire_id, array_agg(prenom order by id) as prenoms from habitant group by territoire_id order by territoire_id",
      );
      expect(rows).toHaveLength(10);
      for (const { prenoms } of rows) {
        expect(prenoms).toHaveLength(3);
        expect(new Set(prenoms).size).toBe(3);
        for (const p of prenoms) expect(liste).toContain(p);
      }
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("range la lecture par Métier, ceux sans Métier en premier, puis par prénom (US-0303)", async () => {
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const t = (await chefDuCompte(pool, compte.id))!.territoireId!;
    const [h1, h2, h3] = (await habitants(t)).map((h) => h.id);
    const nommer = (id: number, prenom: string, metier: string | null) =>
      pool.query("update habitant set prenom = $2, metier = $3 where id = $1", [id, prenom, metier]);
    await nommer(h1, "Talo", "chasseur");
    await nommer(h2, "Miro", null);
    await nommer(h3, "Brune", "chasseur");
    await pool.query(
      `insert into habitant (territoire_id, prenom, metier) values ($1, 'Dara', 'bucheron'), ($1, 'Arno', null), ($1, 'Miro', null)`,
      [t],
    );
    const lus = await habitantsDuTerritoire(pool, t);
    expect(lus.map((h) => [h.prenom, h.metier])).toEqual([
      ["Arno", null],
      ["Miro", null],
      ["Miro", null],
      ["Dara", "bucheron"],
      ["Brune", "chasseur"],
      ["Talo", "chasseur"],
    ]);
    // Deux prénoms pareils : le premier arrivé d'abord.
    expect(lus[1].id).toBe(h2);
    expect(lus.every((h) => h.etat === "libre")).toBe(true);
  });

  it("compte les Habitants du Territoire pour la barre du haut, et suit chaque arrivée et chaque départ (US-0304)", async () => {
    const a = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, a.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const b = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, b.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    const [ta, tb] = [(await chefDuCompte(pool, a.id))!.territoireId!, (await chefDuCompte(pool, b.id))!.territoireId!];
    expect(await nombreDHabitants(pool, ta)).toBe(3);
    await pool.query("insert into habitant (territoire_id, prenom) values ($1, 'Arno'), ($1, 'Dara')", [ta]);
    expect(await nombreDHabitants(pool, ta)).toBe(5);
    await pool.query("delete from habitant where id in (select id from habitant where territoire_id = $1 order by id limit 4)", [ta]);
    expect(await nombreDHabitants(pool, ta)).toBe(1);
    expect(await nombreDHabitants(pool, tb)).toBe(3);
    expect(await nombreDHabitants(pool, -1)).toBe(0);
  });
});
