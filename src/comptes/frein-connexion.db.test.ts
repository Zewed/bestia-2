import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { seConnecterAvecFrein } from "./connexion";

describe.skipIf(!URL_TEST)("essais répétés de mot de passe (sur base)", () => {
  let pool: Pool;
  // Tout ce que ce lancement crée porte cette marque, et s'efface à la fin.
  const lancement = `frein-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.query("delete from echec_connexion where empreinte_adresse like $1", [`${lancement}-%`]);
    await pool.end();
  });

  /** Un compte neuf, et de quoi essayer de s'y connecter (l'empreinte de l'adresse est simulée). */
  async function joueur() {
    const email = `${lancement}-${++numero}@essai.test`;
    await creerCompte(pool, email, "une phrase de passe");
    const essayer = (motDePasse: string) => seConnecterAvecFrein(pool, { email, motDePasse, empreinteAdresse: `${lancement}-${email}` });
    return { email, essayer };
  }

  it("bloque 15 minutes au 5e échec d'affilée, même avec le bon mot de passe ensuite", async () => {
    const { essayer } = await joueur();
    for (let i = 0; i < 4; i++) expect(await essayer("faux")).toEqual({ statut: "refusee" });
    expect(await essayer("faux")).toEqual({ statut: "bloquee", minutes: 15 });
    expect(await essayer("une phrase de passe")).toMatchObject({ statut: "bloquee" });
  });

  it("laisse se connecter à la fin du blocage, et remet alors le décompte à zéro", async () => {
    const { email, essayer } = await joueur();
    for (let i = 0; i < 5; i++) await essayer("faux");
    await pool.query("update echec_connexion set bloque_jusqua = now() - interval '1 second' where empreinte_adresse = $1", [`${lancement}-${email}`]);
    expect(await essayer("une phrase de passe")).toMatchObject({ statut: "acceptee", compte: { email } });
    for (let i = 0; i < 4; i++) expect(await essayer("faux")).toEqual({ statut: "refusee" });
  });

  it("ne compte que les échecs d'affilée : un succès efface les précédents", async () => {
    const { essayer } = await joueur();
    for (let i = 0; i < 3; i++) await essayer("faux");
    expect(await essayer("une phrase de passe")).toMatchObject({ statut: "acceptee" });
    for (let i = 0; i < 4; i++) expect(await essayer("faux")).toEqual({ statut: "refusee" });
  });

  it("bloque aussi une adresse inconnue, pour ne rien révéler", async () => {
    const email = `${lancement}-inconnue@essai.test`;
    const essayer = () => seConnecterAvecFrein(pool, { email, motDePasse: "faux", empreinteAdresse: `${lancement}-${email}` });
    for (let i = 0; i < 4; i++) expect(await essayer()).toEqual({ statut: "refusee" });
    expect(await essayer()).toEqual({ statut: "bloquee", minutes: 15 });
  });

  it("dit combien de minutes il reste à attendre", async () => {
    const { email, essayer } = await joueur();
    for (let i = 0; i < 5; i++) await essayer("faux");
    await pool.query("update echec_connexion set bloque_jusqua = now() + interval '6 minutes 30 seconds' where empreinte_adresse = $1", [`${lancement}-${email}`]);
    expect(await essayer("une phrase de passe")).toEqual({ statut: "bloquee", minutes: 7 });
  });
});
