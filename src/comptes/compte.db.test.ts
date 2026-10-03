import type { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { normaliserEmail } from "./email";
import { verifierEmpreinte } from "./empreinte";

// Une empreinte bien formée, pour les essais qui ne portent que sur l'adresse.
const EMPREINTE_ESSAI = "scrypt$131072$8$1$c2Vs$Y2zDqQ==";

describe.skipIf(!URL_TEST)("adresse e-mail des comptes (sur base)", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.end();
  });
  // Chaque essai travaille dans une transaction annulée à la fin : la base de test reste vide de comptes.
  beforeEach(async () => {
    client = await pool.connect();
    await client.query("begin");
  });
  afterEach(async () => {
    await client.query("rollback");
    client.release();
  });

  /** Tente d'enregistrer une adresse telle quelle ; rend le code d'erreur de la base, ou null. */
  async function enregistrer(email: string): Promise<string | null> {
    await client.query("savepoint essai");
    try {
      await client.query("insert into compte (email, empreinte_mot_de_passe) values ($1, $2)", [email, EMPREINTE_ESSAI]);
      await client.query("release savepoint essai");
      return null;
    } catch (erreur) {
      await client.query("rollback to savepoint essai");
      return (erreur as { code?: string }).code ?? "inconnu";
    }
  }

  it("enregistre l'adresse en minuscules, sans les espaces autour", async () => {
    expect(await enregistrer(normaliserEmail("  Nom@Exemple.fr "))).toBeNull();
    const { rows } = await client.query("select email from compte");
    expect(rows).toEqual([{ email: "nom@exemple.fr" }]);
  });

  it.each(["Nom@Exemple.fr", " nom@exemple.fr", "nom@exemple.fr\t"])("refuse d'enregistrer « %s » tel quel", async (email) => {
    expect(await enregistrer(email)).toBe("23514"); // contrainte compte_email_normalise
  });

  it("fait de « Nom@Exemple.fr » et « nom@exemple.fr » un seul et même compte", async () => {
    expect(await enregistrer(normaliserEmail("nom@exemple.fr"))).toBeNull();
    expect(await enregistrer(normaliserEmail("Nom@Exemple.fr"))).toBe("23505"); // déjà utilisée
    const { rows } = await client.query("select count(*)::int as n from compte where email = $1", [normaliserEmail(" NOM@exemple.FR ")]);
    expect(rows[0].n).toBe(1);
  });

  it("crée un compte avec l'adresse normalisée, l'empreinte du mot de passe et sa date de création", async () => {
    const avant = Date.now();
    const compte = await creerCompte(client, " Nom@Exemple.fr ", "une phrase de passe");
    expect(compte).toMatchObject({ email: "nom@exemple.fr" });
    expect(compte!.creeLe.getTime()).toBeGreaterThanOrEqual(avant - 60_000);
    const { rows } = await client.query("select * from compte where id = $1", [compte!.id]);
    expect(JSON.stringify(rows[0])).not.toContain("une phrase de passe");
    expect(await verifierEmpreinte("une phrase de passe", rows[0].empreinte_mot_de_passe)).toBe(true);
  });

  it("ne crée rien pour une adresse qui a déjà un compte, majuscules comprises", async () => {
    expect(await creerCompte(client, "nom@exemple.fr", "une phrase de passe")).not.toBeNull();
    expect(await creerCompte(client, "NOM@exemple.fr", "une autre phrase")).toBeNull();
    const { rows } = await client.query("select count(*)::int as n from compte");
    expect(rows[0].n).toBe(1);
  });

  it("refuse d'enregistrer un mot de passe en clair à la place de l'empreinte", async () => {
    await client.query("savepoint essai");
    const erreur = await client
      .query("insert into compte (email, empreinte_mot_de_passe) values ($1, $2)", ["nom@exemple.fr", "une phrase de passe"])
      .catch((e: { code?: string }) => e.code);
    await client.query("rollback to savepoint essai");
    expect(erreur).toBe("23514"); // contrainte compte_empreinte_scrypt
  });
});
