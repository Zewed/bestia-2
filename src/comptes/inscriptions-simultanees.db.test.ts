import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";

describe.skipIf(!URL_TEST)("deux inscriptions avec la même adresse au même instant (sur base)", () => {
  let pool: Pool;
  // Une adresse propre à ce lancement : les deux inscriptions sont réellement enregistrées, puis effacées.
  const email = `course-${Date.now()}-${Math.random().toString(36).slice(2)}@essai.test`;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email = $1", [email]);
    await pool.end();
  });

  it("ne créent qu'un seul compte : la base l'interdit", async () => {
    const resultats = await Promise.all([
      creerCompte(pool, email, "une phrase de passe"),
      creerCompte(pool, email.toUpperCase(), "une autre phrase"),
    ]);
    expect(resultats.filter(Boolean)).toHaveLength(1);
    const { rows } = await pool.query("select count(*)::int as n from compte where email = $1", [email]);
    expect(rows[0].n).toBe(1);
  });
});
