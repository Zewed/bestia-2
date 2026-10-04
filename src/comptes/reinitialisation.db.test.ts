import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { preparerReinitialisation } from "./reinitialisation";

describe.skipIf(!URL_TEST)("liens pour changer de mot de passe (sur base)", () => {
  let pool: Pool;
  const lancement = `oubli-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("prépare un lien pour une adresse qui a un compte, majuscules comprises, valable 60 minutes", async () => {
    const compte = await nouveauCompte();
    const lien = await preparerReinitialisation(pool, ` ${compte.email.toUpperCase()} `);
    expect(lien?.email).toBe(compte.email);
    const { rows } = await pool.query(
      "select expire_le between now() + interval '59 minutes' and now() + interval '61 minutes' as soixante, utilise_le from lien_reinitialisation where compte_id = $1",
      [compte.id],
    );
    expect(rows).toEqual([{ soixante: true, utilise_le: null }]);
  });

  it("ne garde jamais le jeton lui-même", async () => {
    const compte = await nouveauCompte();
    const lien = await preparerReinitialisation(pool, compte.email);
    const { rows } = await pool.query("select * from lien_reinitialisation where compte_id = $1", [compte.id]);
    expect(JSON.stringify(rows)).not.toContain(lien!.jeton);
  });

  it("ne prépare rien pour une adresse sans compte", async () => {
    expect(await preparerReinitialisation(pool, `${lancement}-inconnue@essai.test`)).toBeNull();
  });

  it("n'envoie pas plus d'un lien par minute à une même adresse", async () => {
    const compte = await nouveauCompte();
    expect(await preparerReinitialisation(pool, compte.email)).not.toBeNull();
    expect(await preparerReinitialisation(pool, compte.email)).toBeNull();
    await pool.query("update lien_reinitialisation set cree_le = now() - interval '2 minutes' where compte_id = $1", [compte.id]);
    expect(await preparerReinitialisation(pool, compte.email)).not.toBeNull();
  });
});
