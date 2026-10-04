import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, URL_TEST } from "@/test/base";
import { chefDuCompte } from "./chef";

describe.skipIf(!URL_TEST)("chef d'un compte (sur base)", () => {
  let pool: Pool;
  const lancement = `chef-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("n'existe pas pour un compte qui vient d'être créé", async () => {
    const compte = await nouveauCompte();
    expect(await chefDuCompte(pool, compte.id)).toBeNull();
  });

  it("porte le nom choisi dans le Monde du jeu", async () => {
    const compte = await nouveauCompte();
    await pool.query("insert into chef (compte_id, monde_id, nom) values ($1, (select id from monde order by id limit 1), 'Ourse')", [compte.id]);
    expect(await chefDuCompte(pool, compte.id)).toEqual({ nom: "Ourse" });
  });

  it("n'est pas celui d'un autre Monde", async () => {
    const compte = await nouveauCompte();
    const { rows } = await pool.query("insert into monde (nom) values ($1) returning id", [`${lancement}-monde`]);
    await pool.query("insert into chef (compte_id, monde_id, nom) values ($1, $2, 'Lynx')", [compte.id, rows[0].id]);
    expect(await chefDuCompte(pool, compte.id)).toBeNull();
  });

  it("n'en a qu'un par Monde", async () => {
    const compte = await nouveauCompte();
    const ajouter = (nom: string) =>
      pool.query("insert into chef (compte_id, monde_id, nom) values ($1, (select id from monde order by id limit 1), $2)", [compte.id, nom]);
    await ajouter("Ourse");
    await expect(ajouter("Lynx")).rejects.toMatchObject({ constraint: "chef_un_par_monde" });
  });
});
