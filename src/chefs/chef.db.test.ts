import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, URL_TEST } from "@/test/base";
import { chefDuCompte, nomDejaPris } from "./chef";
import { cleDuNom } from "./nom";

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
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), 'Ourse', $2)", [compte.id, `ourse${numero}${lancement.replace(/[^a-z0-9]/g, "")}`]);
    expect(await chefDuCompte(pool, compte.id)).toEqual({ nom: "Ourse" });
  });

  it("n'est pas celui d'un autre Monde", async () => {
    const compte = await nouveauCompte();
    const { rows } = await pool.query("insert into monde (nom) values ($1) returning id", [`${lancement}-monde`]);
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, 'Lynx', 'lynx')", [compte.id, rows[0].id]);
    expect(await chefDuCompte(pool, compte.id)).toBeNull();
  });

  it("n'en a qu'un par Monde", async () => {
    const compte = await nouveauCompte();
    const ajouter = (nom: string) =>
      pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [
        compte.id,
        nom,
        `${cleDuNom(nom)}${numero}${lancement.replace(/[^a-z0-9]/g, "")}`,
      ]);
    await ajouter("Ourse");
    await expect(ajouter("Lynx")).rejects.toMatchObject({ constraint: "chef_un_par_monde" });
  });

  /** Un nom propre à ce lancement, pour ne pas croiser les chefs des autres essais. */
  const nomUnique = (base: string) => `${base}${lancement.slice(-6).replace(/[^a-z]/g, "x")}`.slice(0, 16);
  const nommer = async (nom: string) => {
    const compte = await nouveauCompte();
    return pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [
      compte.id,
      nom,
      cleDuNom(nom),
    ]);
  };

  it("sait qu'un nom est déjà pris, majuscules, accents et signes mis à part (US-0135)", async () => {
    const nom = nomUnique("Élan");
    expect(await nomDejaPris(pool, nom)).toBe(false);
    await nommer(nom);
    expect(await nomDejaPris(pool, nom)).toBe(true);
    expect(await nomDejaPris(pool, nom.replace("Élan", "e-LAN"))).toBe(true);
    expect(await nomDejaPris(pool, nom.replace("Élan", "Élans"))).toBe(false);
  });

  it("refuse en base deux noms jugés identiques dans le même Monde", async () => {
    const nom = nomUnique("Cœur");
    await nommer(nom);
    await expect(nommer(nom.replace("Cœur", "Coeur"))).rejects.toMatchObject({ constraint: "chef_nom_unique_dans_le_monde" });
  });

  it("refuse en base une forme de comparaison qui ne serait pas à plat", async () => {
    const compte = await nouveauCompte();
    await expect(
      pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), 'Élan', 'Élan')", [compte.id]),
    ).rejects.toMatchObject({ constraint: "chef_cle_nom_a_plat" });
  });
});

