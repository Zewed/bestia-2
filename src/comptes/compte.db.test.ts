import type { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { normaliserEmail } from "./email";

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
      await client.query("insert into compte (email) values ($1)", [email]);
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
});
