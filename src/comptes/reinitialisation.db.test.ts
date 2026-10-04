import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { verifierIdentifiants } from "./connexion";
import { changerMotDePasse, etatDuLien, preparerReinitialisation } from "./reinitialisation";
import { compteDeLaSession, ouvrirSession } from "./session";

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

describe.skipIf(!URL_TEST)("choisir un nouveau mot de passe (sur base)", () => {
  let pool: Pool;
  const lancement = `nouveau-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  /** Un compte avec deux sessions ouvertes et un lien pour changer de mot de passe. */
  async function situation() {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "l'ancien mot de passe"))!;
    const ordinateur = await ouvrirSession(pool, compte.id);
    const telephone = await ouvrirSession(pool, compte.id);
    const { jeton } = (await preparerReinitialisation(pool, compte.email))!;
    return { compte, jeton, sessions: [ordinateur.jeton, telephone.jeton] };
  }

  it("remplace l'ancien mot de passe, qui ne fonctionne plus", async () => {
    const { compte, jeton } = await situation();
    expect(await etatDuLien(pool, jeton)).toEqual({ etat: "valable", email: compte.email });
    expect(await changerMotDePasse(pool, jeton, "le nouveau mot de passe")).toEqual({ id: compte.id, email: compte.email });
    expect(await verifierIdentifiants(pool, compte.email, "le nouveau mot de passe")).toMatchObject({ id: compte.id });
    expect(await verifierIdentifiants(pool, compte.email, "l'ancien mot de passe")).toBeNull();
  });

  it("ferme toutes les sessions du compte, et confirme l'adresse au passage", async () => {
    const { compte, jeton, sessions } = await situation();
    await changerMotDePasse(pool, jeton, "le nouveau mot de passe");
    for (const session of sessions) expect(await compteDeLaSession(pool, session)).toBeNull();
    const { rows } = await pool.query("select email_confirme_le is not null as confirmee from compte where id = $1", [compte.id]);
    expect(rows[0].confirmee).toBe(true);
  });

  it("use le lien, et les autres liens du compte avec lui", async () => {
    const { compte, jeton } = await situation();
    await pool.query("update lien_reinitialisation set cree_le = now() - interval '2 minutes' where compte_id = $1", [compte.id]);
    const autre = (await preparerReinitialisation(pool, compte.email))!;
    // Deux demandes au même instant peuvent laisser deux liens valables : on rend vie au premier.
    await pool.query("update lien_reinitialisation set expire_le = now() + interval '1 hour' where compte_id = $1", [compte.id]);
    await changerMotDePasse(pool, autre.jeton, "le nouveau mot de passe");
    expect(await etatDuLien(pool, autre.jeton)).toEqual({ etat: "utilise" });
    expect(await etatDuLien(pool, jeton)).toEqual({ etat: "expire" });
    expect(await changerMotDePasse(pool, autre.jeton, "encore un autre")).toBeNull();
    expect(await changerMotDePasse(pool, jeton, "encore un autre")).toBeNull();
    expect(await verifierIdentifiants(pool, compte.email, "le nouveau mot de passe")).not.toBeNull();
  });

  it("ne change rien avec un lien expiré ou inventé", async () => {
    const { compte, jeton, sessions } = await situation();
    await pool.query("update lien_reinitialisation set expire_le = now() - interval '1 second' where compte_id = $1", [compte.id]);
    expect(await etatDuLien(pool, jeton)).toEqual({ etat: "expire" });
    expect(await etatDuLien(pool, "un-jeton-invente")).toEqual({ etat: "inconnu" });
    expect(await changerMotDePasse(pool, jeton, "le nouveau mot de passe")).toBeNull();
    expect(await changerMotDePasse(pool, "un-jeton-invente", "le nouveau mot de passe")).toBeNull();
    expect(await verifierIdentifiants(pool, compte.email, "l'ancien mot de passe")).not.toBeNull();
    expect(await compteDeLaSession(pool, sessions[0])).not.toBeNull();
  });

  it("rend inutilisables les liens précédents quand un nouveau lien est demandé (US-0129)", async () => {
    const { compte, jeton } = await situation();
    await pool.query("update lien_reinitialisation set cree_le = now() - interval '2 minutes' where compte_id = $1", [compte.id]);
    const nouveau = (await preparerReinitialisation(pool, compte.email))!;
    expect(await etatDuLien(pool, jeton)).toEqual({ etat: "expire" });
    expect(await changerMotDePasse(pool, jeton, "le nouveau mot de passe")).toBeNull();
    expect(await etatDuLien(pool, nouveau.jeton)).toEqual({ etat: "valable", email: compte.email });
  });
});
