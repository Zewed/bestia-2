import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { poolDeTest, URL_TEST } from "@/test/base";
import { inscrireCompte } from "./inscription";

describe.skipIf(!URL_TEST)("inscriptions en rafale (sur base)", () => {
  let pool: Pool;
  // Tout ce que ce lancement crée porte cette marque, et s'efface à la fin.
  const lancement = `rafale-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const email = () => `${lancement}-${++numero}@essai.test`;
  const connexion = (nom: string) => `${lancement}-${nom}`;
  const inscrire = async (empreinteReseau: string, adresse = email()) =>
    (await inscrireCompte(pool, { email: adresse, motDePasse: "une phrase de passe", empreinteReseau })).statut;

  beforeAll(() => {
    pool = poolDeTest();
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.query("delete from inscription_recente where empreinte_reseau like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("accepte 5 comptes en une heure depuis une même connexion, puis refuse les suivants", async () => {
    const maison = connexion("maison");
    for (let i = 0; i < 5; i++) expect(await inscrire(maison)).toBe("cree");
    expect(await inscrire(maison)).toBe("freinee");
    expect(await inscrire(connexion("voisin"))).toBe("cree");
  });

  it("ne compte que les comptes réellement créés", async () => {
    const bureau = connexion("bureau");
    const adresse = email();
    expect(await inscrire(bureau, adresse)).toBe("cree");
    for (let i = 0; i < 5; i++) expect(await inscrire(bureau, adresse)).toBe("deja-inscrite");
    for (let i = 0; i < 4; i++) expect(await inscrire(bureau)).toBe("cree");
    expect(await inscrire(bureau)).toBe("freinee");
  });

  it("oublie ce qui a plus d'une heure, et l'efface", async () => {
    const ecole = connexion("ecole");
    for (let i = 0; i < 5; i++) {
      await pool.query("insert into inscription_recente (empreinte_reseau, le) values ($1, now() - interval '61 minutes')", [ecole]);
    }
    expect(await inscrire(ecole)).toBe("cree");
    const { rows } = await pool.query("select count(*)::int as n from inscription_recente where empreinte_reseau = $1", [ecole]);
    expect(rows[0].n).toBe(1);
  });

  it("ne dépasse pas la limite quand dix envois arrivent au même instant", async () => {
    const usine = connexion("usine");
    const resultats = await Promise.all(Array.from({ length: 10 }, () => inscrire(usine)));
    expect(resultats.filter((r) => r === "cree")).toHaveLength(5);
    expect(resultats.filter((r) => r === "freinee")).toHaveLength(5);
  });

  it("crée avec le compte son premier lien de confirmation d'adresse", async () => {
    const adresse = email();
    const resultat = await inscrireCompte(pool, { email: adresse.toUpperCase(), motDePasse: "une phrase de passe", empreinteReseau: connexion("lien") });
    expect(resultat).toMatchObject({ statut: "cree", email: adresse, compteId: expect.any(Number) });
    const { rows } = await pool.query(
      "select l.expire_le > now() + interval '23 hours' as valable from lien_confirmation l join compte c on c.id = l.compte_id where c.email = $1",
      [adresse],
    );
    expect(rows).toEqual([{ valable: true }]);
  });
});
