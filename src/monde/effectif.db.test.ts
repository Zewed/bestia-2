import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chefDuCompte, enregistrerNomDeChef } from "@/chefs/chef";
import { creerCompte } from "@/comptes/compte";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { betesDisponibles } from "./effectif";

describe.skipIf(!URL_TEST)("les Bêtes disponibles pour l'escorte (US-0904, sur base)", () => {
  let pool: Pool;
  const lancement = `effectif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;

  /** Un joueur qui vient de naître, sans aucune Bête (ADR 0008) : son compte et son Territoire. */
  const nouveauTerritoire = async () => {
    const compte = (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;
    const nom = `Eff${lancement.slice(-5).replace(/[^a-z]/g, "x")}${"abcdefghij"[numero % 10]}`;
    expect(await enregistrerNomDeChef(pool, compte.id, nom)).toMatchObject({ statut: "enregistre" });
    return { compteId: compte.id, territoireId: (await chefDuCompte(pool, compte.id))!.territoireId! };
  };
  /** Des Bêtes dans l'effectif du Territoire : une ligne par Espèce et par sexe, avec leur nombre. */
  const ajouter = (territoireId: number, lignes: [string, "male" | "femelle", number][]) =>
    pool.query(
      `insert into effectif (territoire_id, espece_id, sexe, nombre)
       select $1, e, s::sexe, n from unnest($2::text[], $3::text[], $4::int[]) as l(e, s, n)`,
      [territoireId, lignes.map((l) => l[0]), lignes.map((l) => l[1]), lignes.map((l) => l[2])],
    );
  /** Les Bêtes de l'effectif du Territoire, toutes lignes comprises. */
  const lignesDeLEffectif = async (territoireId: number) =>
    (await pool.query<{ n: number }>("select count(*)::int as n from effectif where territoire_id = $1", [territoireId])).rows[0].n;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("ne propose aucune Bête à un joueur qui vient de naître : il n'en a pas", async () => {
    const { territoireId } = await nouveauTerritoire();
    expect(await betesDisponibles(pool, territoireId)).toEqual([]);
    expect(await lignesDeLEffectif(territoireId)).toBe(0);
  });

  it("propose chaque Espèce de l'effectif du Territoire, mâles et femelles ensemble, avec son nom et son illustration", async () => {
    const t = (await nouveauTerritoire()).territoireId;
    const voisin = (await nouveauTerritoire()).territoireId;
    await ajouter(t, [
      ["souris", "male", 2],
      ["souris", "femelle", 1],
      ["poule", "femelle", 1],
    ]);
    await ajouter(voisin, [
      ["pigeon", "male", 5],
      ["souris", "male", 7],
    ]);
    // Ni le pigeon ni les souris d'un autre Territoire ; de la plus commune à la plus rare, puis par nom.
    expect(await betesDisponibles(pool, t)).toEqual([
      { id: "poule", nom: "Poule", illustration: "especes/poule.webp", disponibles: 1 },
      { id: "souris", nom: "Souris grise", illustration: "especes/souris.webp", disponibles: 3 },
    ]);
  });

  it("range une Espèce plus rare après les communes, même sans illustration", async () => {
    const t = (await nouveauTerritoire()).territoireId;
    // La plus rare des Espèces chargées, sans illustration : l'une des Espèces d'essai (US-0924), jamais nommée ici.
    const { rows } = await pool.query<{ id: string; nom: string }>(
      `select e.id, e.nom from espece e join rarete r on r.id = e.rarete_id where e.illustration is null order by r.rang desc, e.id limit 1`,
    );
    const [rare] = rows;
    await ajouter(t, [
      [rare.id, "femelle", 1],
      ["souris", "male", 4],
    ]);
    expect(await betesDisponibles(pool, t)).toEqual([
      { id: "souris", nom: "Souris grise", illustration: "especes/souris.webp", disponibles: 4 },
      { id: rare.id, nom: rare.nom, illustration: null, disponibles: 1 },
    ]);
  });

  it("ne propose pas une Espèce dont il ne reste aucune Bête", async () => {
    const t = (await nouveauTerritoire()).territoireId;
    await ajouter(t, [
      ["souris", "male", 0],
      ["souris", "femelle", 0],
      ["poule", "male", 2],
    ]);
    expect((await betesDisponibles(pool, t)).map((e) => [e.id, e.disponibles])).toEqual([["poule", 2]]);
  });

  it("suit l'effectif : une Bête de plus compte aussitôt", async () => {
    const t = (await nouveauTerritoire()).territoireId;
    await ajouter(t, [["pigeon", "male", 1]]);
    expect((await betesDisponibles(pool, t)).map((e) => e.disponibles)).toEqual([1]);
    await pool.query("update effectif set nombre = nombre + 2 where territoire_id = $1", [t]);
    expect((await betesDisponibles(pool, t)).map((e) => e.disponibles)).toEqual([3]);
  });

  it("refuse un nombre de Bêtes négatif, un sexe inconnu, une Espèce inconnue, et deux lignes pour la même Espèce et le même sexe", async () => {
    const t = (await nouveauTerritoire()).territoireId;
    await expect(ajouter(t, [["souris", "male", -1]])).rejects.toThrow(/effectif_jamais_negatif/);
    await expect(pool.query("insert into effectif values ($1, 'souris', 'hermaphrodite', 1)", [t])).rejects.toThrow(/sexe/);
    await expect(ajouter(t, [["espece_inconnue", "male", 1]])).rejects.toThrow(/effectif_espece_id_espece_id_fk/);
    await ajouter(t, [["souris", "male", 1]]);
    await expect(ajouter(t, [["souris", "male", 1]])).rejects.toThrow(/effectif_territoire_id_espece_id_sexe_pk/);
  });

  it("part avec le Territoire", async () => {
    const { compteId, territoireId } = await nouveauTerritoire();
    await ajouter(territoireId, [
      ["souris", "male", 3],
      ["poule", "femelle", 1],
    ]);
    expect(await lignesDeLEffectif(territoireId)).toBe(2);
    await pool.query("delete from compte where id = $1", [compteId]);
    expect(await lignesDeLEffectif(territoireId)).toBe(0);
  });
});
