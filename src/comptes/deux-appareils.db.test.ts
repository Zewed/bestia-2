import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { seConnecterAvecFrein } from "./connexion";
import { compteDeLaSession, fermerSession, ouvrirSession } from "./session";

// US-0124 : un joueur sur son ordinateur et sur son téléphone en même temps. Chaque appareil
// suit le même chemin qu'une vraie connexion, et garde sa propre session.
describe.skipIf(!URL_TEST)("deux appareils pour un même joueur (sur base)", () => {
  let pool: Pool;
  const lancement = `appareils-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `${lancement}@essai.test`;

  beforeAll(async () => {
    pool = poolDeTest();
    await creerCompte(pool, email, "une phrase de passe");
  });
  afterAll(async () => {
    await pool.query("delete from echec_connexion where empreinte_adresse = $1", [lancement]);
    await pool.query("delete from compte where email = $1", [email]);
    await pool.end();
  });

  async function seConnecterSur(): Promise<string> {
    const resultat = await seConnecterAvecFrein(pool, { email, motDePasse: "une phrase de passe", empreinteAdresse: lancement });
    if (resultat.statut !== "acceptee") throw new Error(`connexion ${resultat.statut}`);
    return (await ouvrirSession(pool, resultat.compte.id)).jeton;
  }

  it("garde l'ordinateur connecté quand le téléphone se connecte, puis l'un sans l'autre à la déconnexion", async () => {
    const ordinateur = await seConnecterSur();
    const telephone = await seConnecterSur();
    expect(telephone).not.toBe(ordinateur);
    expect(await compteDeLaSession(pool, ordinateur)).toMatchObject({ email });
    expect(await compteDeLaSession(pool, telephone)).toMatchObject({ email });

    await fermerSession(pool, telephone);
    expect(await compteDeLaSession(pool, telephone)).toBeNull();
    expect(await compteDeLaSession(pool, ordinateur)).toMatchObject({ email });
  });
});
