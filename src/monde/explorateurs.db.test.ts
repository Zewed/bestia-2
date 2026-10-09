import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { explorateursDuTerritoire, prochainRetourDUnExplorateur } from "./explorateurs";

describe.skipIf(!URL_TEST)("les explorateurs de l'écran d'Expédition (US-0902, sur base)", () => {
  let pool: Pool;
  const lancement = `explorateurs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  /** Un joueur qui vient de naître, et son Territoire, avec ses trois Habitants sans Métier. */
  const nouveauTerritoire = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    const nom = `Exp${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[numero % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom)).toMatchObject({ statut: "enregistre" });
    return (await chefDuCompte(pool, compte.id))!.territoireId!;
  };
  /** Des Habitants de plus au Territoire, un par Métier donné (null : sans Métier). */
  const ajouter = (territoireId: number, metiers: (string | null)[]) =>
    pool.query(`insert into habitant (territoire_id, prenom, metier) select $1, 'Essai', m from unnest($2::text[]) m`, [territoireId, metiers]);

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("ne compte que les Habitants au Métier d'explorateur du Territoire, libres sur total", async () => {
    const t = await nouveauTerritoire();
    const voisin = await nouveauTerritoire();
    await ajouter(t, ["explorateur", "explorateur", "chasseur", "bucheron"]);
    await ajouter(voisin, ["explorateur", "explorateur", "explorateur"]);
    // Ni les trois sans Métier de la naissance, ni le chasseur, ni le bûcheron, ni les explorateurs d'un autre Territoire.
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 2, total: 2 });
  });

  it("compte zéro sur zéro sans aucun explorateur", async () => {
    expect(await explorateursDuTerritoire(pool, await nouveauTerritoire())).toEqual({ libres: 0, total: 0 });
  });

  it("suit le Métier : un Habitant qui le reçoit compte aussitôt, un explorateur qui le perd ne compte plus", async () => {
    const t = await nouveauTerritoire();
    await pool.query("update habitant set metier = 'explorateur' where territoire_id = $1", [t]);
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 3, total: 3 });
    await pool.query("update habitant set metier = 'cueilleur' where id = (select min(id) from habitant where territoire_id = $1)", [t]);
    expect(await explorateursDuTerritoire(pool, t)).toEqual({ libres: 2, total: 2 });
  });

  it("n'a aucun retour à attendre tant qu'aucune Expédition ne part (US-0903 ; les départs viennent avec US-0911)", async () => {
    const t = await nouveauTerritoire();
    await ajouter(t, ["explorateur", "explorateur"]);
    expect(await prochainRetourDUnExplorateur(pool, t)).toBeNull();
    expect(await prochainRetourDUnExplorateur(pool, await nouveauTerritoire())).toBeNull();
  });
});
