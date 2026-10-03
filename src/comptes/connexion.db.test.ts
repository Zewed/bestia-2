import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { noterConnexion, verifierIdentifiants } from "./connexion";
import { compteDeLaSession, fermerSession, ouvrirSession, prolongerSession } from "./session";

describe.skipIf(!URL_TEST)("connexion et sessions (sur base)", () => {
  let pool: Pool;
  // Tout ce que ce lancement crée porte cette marque, et s'efface à la fin (les sessions partent avec leur compte).
  const lancement = `connexion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `${lancement}@essai.test`;
  let compteId: number;

  beforeAll(async () => {
    pool = poolDeTest();
    compteId = (await creerCompte(pool, email, "une phrase de passe"))!.id;
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}%`]);
    await pool.end();
  });

  it("reconnaît l'adresse et le mot de passe justes, majuscules et espaces compris dans l'adresse", async () => {
    expect(await verifierIdentifiants(pool, email, "une phrase de passe")).toEqual({ id: compteId, email });
    expect(await verifierIdentifiants(pool, `  ${email.toUpperCase()} `, "une phrase de passe")).toEqual({ id: compteId, email });
  });

  it("refuse un mauvais mot de passe ou une adresse inconnue", async () => {
    expect(await verifierIdentifiants(pool, email, "une phrase de passE")).toBeNull();
    expect(await verifierIdentifiants(pool, `inconnu-${email}`, "une phrase de passe")).toBeNull();
  });

  it("note la date de la dernière connexion", async () => {
    await noterConnexion(pool, compteId);
    const { rows } = await pool.query("select derniere_connexion_le > now() - interval '1 minute' as recente from compte where id = $1", [compteId]);
    expect(rows[0].recente).toBe(true);
  });

  it("ouvre une session qui retrouve le compte, sans garder le jeton lui-même", async () => {
    const { jeton, expireLe } = await ouvrirSession(pool, compteId);
    expect(expireLe.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 3_600_000);
    expect(await compteDeLaSession(pool, jeton)).toEqual({ id: compteId, email });
    const { rows } = await pool.query("select * from session where compte_id = $1", [compteId]);
    expect(JSON.stringify(rows)).not.toContain(jeton);
  });

  it("ne retrouve rien avec un jeton inventé ou une session expirée", async () => {
    expect(await compteDeLaSession(pool, "un-jeton-invente")).toBeNull();
    const { jeton } = await ouvrirSession(pool, compteId);
    await pool.query("update session set expire_le = now() - interval '1 second' where compte_id = $1", [compteId]);
    expect(await compteDeLaSession(pool, jeton)).toBeNull();
  });
});

describe.skipIf(!URL_TEST)("temps de réponse d'une connexion refusée (sur base)", () => {
  let pool: Pool;
  const lancement = `temps-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `${lancement}@essai.test`;

  beforeAll(async () => {
    pool = poolDeTest();
    await creerCompte(pool, email, "une phrase de passe");
    // Le premier refus d'une adresse inconnue calcule l'empreinte factice : on le fait avant de mesurer.
    await verifierIdentifiants(pool, `inconnu-${email}`, "un essai");
  });
  afterAll(async () => {
    await pool.query("delete from compte where email = $1", [email]);
    await pool.end();
  });

  async function duree(adresse: string): Promise<number> {
    const debut = performance.now();
    for (let i = 0; i < 4; i++) expect(await verifierIdentifiants(pool, adresse, "un mauvais mot de passe")).toBeNull();
    return performance.now() - debut;
  }

  it("est le même pour une adresse inconnue et pour un mot de passe faux", async () => {
    const inconnue = await duree(`inconnu-${email}`);
    const motDePasseFaux = await duree(email);
    // Le calcul de l'empreinte domine les deux cas ; sans lui, l'adresse inconnue répondrait cent fois plus vite.
    expect(inconnue / motDePasseFaux).toBeGreaterThan(0.6);
    expect(inconnue / motDePasseFaux).toBeLessThan(1.6);
  });
});

describe.skipIf(!URL_TEST)("prolongation des sessions (sur base)", () => {
  let pool: Pool;
  const lancement = `prolongation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let compteId: number;

  beforeAll(async () => {
    pool = poolDeTest();
    compteId = (await creerCompte(pool, `${lancement}@essai.test`, "une phrase de passe"))!.id;
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}%`]);
    await pool.end();
  });

  const finDans = async (jeton: string, intervalle: string) => {
    await pool.query("update session set expire_le = now() + $2::interval where empreinte_jeton = encode(sha256($1::bytea), 'hex')", [jeton, intervalle]);
  };

  it("prolonge de 30 jours une session dont la dernière prolongation a plus d'un jour", async () => {
    const { jeton } = await ouvrirSession(pool, compteId);
    await finDans(jeton, "20 days");
    const fin = await prolongerSession(pool, jeton);
    expect(fin!.getTime()).toBeGreaterThan(Date.now() + 29.9 * 24 * 3_600_000);
  });

  it("ne réécrit pas une session prolongée il y a moins d'un jour", async () => {
    const { jeton } = await ouvrirSession(pool, compteId);
    expect(await prolongerSession(pool, jeton)).toBeNull();
    await finDans(jeton, "29 days 2 hours");
    expect(await prolongerSession(pool, jeton)).toBeNull();
  });

  it("ne ranime ni une session expirée, ni un jeton inventé", async () => {
    const { jeton } = await ouvrirSession(pool, compteId);
    await finDans(jeton, "-1 second");
    expect(await prolongerSession(pool, jeton)).toBeNull();
    expect(await compteDeLaSession(pool, jeton)).toBeNull();
    expect(await prolongerSession(pool, "un-jeton-invente")).toBeNull();
  });
});

describe.skipIf(!URL_TEST)("fermeture des sessions (sur base)", () => {
  let pool: Pool;
  const lancement = `fermeture-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let compteId: number;

  beforeAll(async () => {
    pool = poolDeTest();
    compteId = (await creerCompte(pool, `${lancement}@essai.test`, "une phrase de passe"))!.id;
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}%`]);
    await pool.end();
  });

  it("supprime la session en base : son jeton ne retrouve plus le compte", async () => {
    const { jeton } = await ouvrirSession(pool, compteId);
    const autre = await ouvrirSession(pool, compteId);
    await fermerSession(pool, jeton);
    expect(await compteDeLaSession(pool, jeton)).toBeNull();
    // Les autres appareils du joueur restent connectés.
    expect(await compteDeLaSession(pool, autre.jeton)).not.toBeNull();
  });
});
