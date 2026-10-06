import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef, naitreSurLaCouronne } from "@/chefs/chef";
import { cleDuNom } from "@/chefs/nom";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";

describe.skipIf(!URL_TEST)("Stocks du Territoire (US-0201, sur base)", () => {
  let pool: Pool;
  const lancement = `stocks-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
  /** Un nom de chef propre à ce lancement, pour ne pas croiser les autres essais. */
  const nomUnique = () => `Stock${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[numero % 10]}`;

  const naitre = async () => {
    const compte = await nouveauCompte();
    expect(await enregistrerNomDeChef(pool, compte.id, nomUnique())).toMatchObject({ statut: "enregistre" });
    return { compte, territoireId: (await chefDuCompte(pool, compte.id))!.territoireId! };
  };
  const stocks = async (territoireId: number) =>
    (
      await pool.query<{ ressource: string; quantite: string }>(
        `select s.ressource_id as ressource, s.quantite from stock s join ressource r on r.id = s.ressource_id
         where s.territoire_id = $1 order by r.ordre`,
        [territoireId],
      )
    ).rows.map((s) => [s.ressource, s.quantite]);
  const ajouter = (territoireId: number, ressource: string, quantite: string) =>
    pool.query("update stock set quantite = quantite + $3 where territoire_id = $1 and ressource_id = $2", [territoireId, ressource, quantite]);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("range en base la Viande et les Végétaux en Nourriture, le Bois et la Pierre en Matériaux", async () => {
    const { rows } = await pool.query("select id, famille from ressource order by ordre");
    expect(rows).toEqual([
      { id: "viande", famille: "nourriture" },
      { id: "vegetaux", famille: "nourriture" },
      { id: "bois", famille: "materiaux" },
      { id: "pierre", famille: "materiaux" },
    ]);
  });

  it("donne à un Territoire, dès sa naissance, un Stock vide de chacune des quatre Ressources", async () => {
    const { territoireId } = await naitre();
    expect(await stocks(territoireId)).toEqual([
      ["viande", "0.000000"],
      ["vegetaux", "0.000000"],
      ["bois", "0.000000"],
      ["pierre", "0.000000"],
    ]);
  });

  it("les donne aussi au chef né avant la Couronne, quand il reçoit son Foyer", async () => {
    const compte = await nouveauCompte();
    const nom = nomUnique();
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [
      compte.id,
      nom,
      cleDuNom(nom),
    ]);
    const territoireId = await naitreSurLaCouronne(pool, compte.id);
    expect(territoireId).not.toBeNull();
    expect((await stocks(territoireId!)).map(([ressource]) => ressource)).toEqual(["viande", "vegetaux", "bois", "pierre"]);
  });

  it("garde les fractions : trois fois 0,4 Bois font 1,2 Bois, sans rien perdre", async () => {
    const { territoireId } = await naitre();
    for (let i = 0; i < 3; i++) await ajouter(territoireId, "bois", "0.4");
    await ajouter(territoireId, "pierre", "0.000001");
    expect(await stocks(territoireId)).toEqual([
      ["viande", "0.000000"],
      ["vegetaux", "0.000000"],
      ["bois", "1.200000"],
      ["pierre", "0.000001"],
    ]);
  });

  it("refuse un Stock négatif, même d'un millionième", async () => {
    const { territoireId } = await naitre();
    await ajouter(territoireId, "viande", "2");
    await expect(ajouter(territoireId, "viande", "-2.000001")).rejects.toMatchObject({ constraint: "stock_jamais_negatif" });
    await ajouter(territoireId, "viande", "-2");
    expect((await stocks(territoireId))[0]).toEqual(["viande", "0.000000"]);
  });

  it("disparaissent avec leur Territoire", async () => {
    const { compte, territoireId } = await naitre();
    await pool.query("delete from compte where id = $1", [compte.id]);
    expect(await stocks(territoireId)).toEqual([]);
  });
});
