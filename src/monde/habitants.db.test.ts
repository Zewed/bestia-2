import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { cleDuNom } from "@/chefs/nom";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";

describe.skipIf(!URL_TEST)("les premiers Habitants (US-0301, sur base)", () => {
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
});
