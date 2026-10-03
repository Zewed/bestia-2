import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { creerCompte } from "./compte";
import { confirmerAdresse, creerLienConfirmation, nouveauLienDepuis } from "./confirmation";

describe.skipIf(!URL_TEST)("confirmation de l'adresse e-mail (sur base)", () => {
  let pool: Pool;
  // Tout ce que ce lancement crée porte cette marque, et s'efface à la fin (les liens partent avec leur compte).
  const lancement = `confirmation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  async function nouveauCompte() {
    const compte = await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe");
    return compte!;
  }
  const etat = async (compteId: number) =>
    (await pool.query("select email_confirme_le is not null as confirme from compte where id = $1", [compteId])).rows[0].confirme;

  it("confirme l'adresse à l'ouverture du lien, puis le lien ne sert plus", async () => {
    const compte = await nouveauCompte();
    const jeton = await creerLienConfirmation(pool, compte.id);
    expect(await etat(compte.id)).toBe(false);
    expect(await confirmerAdresse(pool, jeton)).toBe("confirmee");
    expect(await etat(compte.id)).toBe(true);
    expect(await confirmerAdresse(pool, jeton)).toBe("deja-confirmee");
  });

  it("refuse un lien périmé, sans confirmer l'adresse", async () => {
    const compte = await nouveauCompte();
    const jeton = await creerLienConfirmation(pool, compte.id);
    await pool.query("update lien_confirmation set expire_le = now() - interval '1 second' where compte_id = $1", [compte.id]);
    expect(await confirmerAdresse(pool, jeton)).toBe("expire");
    expect(await etat(compte.id)).toBe(false);
  });

  it("reconnaît une adresse déjà confirmée, même par un autre lien", async () => {
    const compte = await nouveauCompte();
    const premier = await creerLienConfirmation(pool, compte.id);
    const second = await creerLienConfirmation(pool, compte.id);
    expect(await confirmerAdresse(pool, premier)).toBe("confirmee");
    expect(await confirmerAdresse(pool, second)).toBe("deja-confirmee");
  });

  it("ne connaît pas un lien inventé, et ne garde jamais le jeton lui-même", async () => {
    expect(await confirmerAdresse(pool, "un-jeton-invente")).toBe("inconnu");
    const compte = await nouveauCompte();
    const jeton = await creerLienConfirmation(pool, compte.id);
    const { rows } = await pool.query("select * from lien_confirmation where compte_id = $1", [compte.id]);
    expect(JSON.stringify(rows)).not.toContain(jeton);
  });

  it("donne un nouveau lien à partir d'un lien périmé, mais pas plus d'une fois par minute", async () => {
    const compte = await nouveauCompte();
    const ancien = await creerLienConfirmation(pool, compte.id);
    await pool.query(
      "update lien_confirmation set cree_le = now() - interval '2 days', expire_le = now() - interval '1 day' where compte_id = $1",
      [compte.id],
    );
    const nouveau = await nouveauLienDepuis(pool, ancien);
    expect(nouveau?.email).toBe(compte.email);
    expect(await nouveauLienDepuis(pool, ancien)).toBeNull();
    expect(await confirmerAdresse(pool, nouveau!.jeton)).toBe("confirmee");
  });

  it("ne donne pas de nouveau lien pour une adresse déjà confirmée ou un lien inventé", async () => {
    const compte = await nouveauCompte();
    const jeton = await creerLienConfirmation(pool, compte.id);
    await confirmerAdresse(pool, jeton);
    await pool.query("update lien_confirmation set cree_le = now() - interval '2 minutes' where compte_id = $1", [compte.id]);
    expect(await nouveauLienDepuis(pool, jeton)).toBeNull();
    expect(await nouveauLienDepuis(pool, "un-jeton-invente")).toBeNull();
  });
});
