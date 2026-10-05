import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerCompte } from "@/comptes/compte";
import { distance } from "@/monde/hex";
import { poolDeTest, preparerMondeDeTest, URL_TEST } from "@/test/base";
import { chefDuCompte, enregistrerNomDeChef, nomDejaPris, nomInterdit } from "./chef";
import { caractereRefuse, cleDuNom, NOM_NON_AUTORISE, NOM_TROP_COURT } from "./nom";

describe.skipIf(!URL_TEST)("chef d'un compte (sur base)", () => {
  let pool: Pool;
  const lancement = `chef-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let numero = 0;
  const nouveauCompte = async () => (await creerCompte(pool, `${lancement}-${++numero}@essai.test`, "une phrase de passe"))!;

  beforeAll(async () => {
    pool = poolDeTest();
    await preparerMondeDeTest(pool);
  });
  afterAll(async () => {
    await pool.query("delete from compte where email like $1", [`${lancement}-%`]);
    await pool.end();
  });

  it("n'existe pas pour un compte qui vient d'être créé", async () => {
    const compte = await nouveauCompte();
    expect(await chefDuCompte(pool, compte.id)).toBeNull();
  });

  it("porte le nom choisi dans le Monde du jeu", async () => {
    const compte = await nouveauCompte();
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), 'Ourse', $2)", [compte.id, `ourse${numero}${lancement.replace(/[^a-z0-9]/g, "")}`]);
    expect(await chefDuCompte(pool, compte.id)).toEqual({ nom: "Ourse" });
  });

  it("n'est pas celui d'un autre Monde", async () => {
    const compte = await nouveauCompte();
    const { rows } = await pool.query("insert into monde (nom) values ($1) returning id", [`${lancement}-monde`]);
    await pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, 'Lynx', 'lynx')", [compte.id, rows[0].id]);
    expect(await chefDuCompte(pool, compte.id)).toBeNull();
  });

  it("n'en a qu'un par Monde", async () => {
    const compte = await nouveauCompte();
    const ajouter = (nom: string) =>
      pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [
        compte.id,
        nom,
        `${cleDuNom(nom)}${numero}${lancement.replace(/[^a-z0-9]/g, "")}`,
      ]);
    await ajouter("Ourse");
    await expect(ajouter("Lynx")).rejects.toMatchObject({ constraint: "chef_un_par_monde" });
  });

  /** Un nom propre à ce lancement, pour ne pas croiser les chefs des autres essais. */
  const nomUnique = (base: string) => `${base}${lancement.slice(-6).replace(/[^a-z]/g, "x")}`.slice(0, 16);
  const nommer = async (nom: string) => {
    const compte = await nouveauCompte();
    return pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), $2, $3)", [
      compte.id,
      nom,
      cleDuNom(nom),
    ]);
  };

  it("sait qu'un nom est déjà pris, majuscules, accents et signes mis à part (US-0135)", async () => {
    const nom = nomUnique("Élan");
    expect(await nomDejaPris(pool, nom)).toBe(false);
    await nommer(nom);
    expect(await nomDejaPris(pool, nom)).toBe(true);
    expect(await nomDejaPris(pool, nom.replace("Élan", "e-LAN"))).toBe(true);
    expect(await nomDejaPris(pool, nom.replace("Élan", "Élans"))).toBe(false);
  });

  it("refuse en base deux noms jugés identiques dans le même Monde", async () => {
    const nom = nomUnique("Cœur");
    await nommer(nom);
    await expect(nommer(nom.replace("Cœur", "Coeur"))).rejects.toMatchObject({ constraint: "chef_nom_unique_dans_le_monde" });
  });

  it("refuse en base une forme de comparaison qui ne serait pas à plat", async () => {
    const compte = await nouveauCompte();
    await expect(
      pool.query("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, (select id from monde order by id limit 1), 'Élan', 'Élan')", [compte.id]),
    ).rejects.toMatchObject({ constraint: "chef_cle_nom_a_plat" });
  });

  describe("enregistrer le nom (US-0137)", () => {
    it("enregistre le nom nettoyé, avec sa forme de comparaison", async () => {
      const compte = await nouveauCompte();
      const nom = nomUnique("Ours Brun");
      expect(await enregistrerNomDeChef(pool, compte.id, `  ${nom.replace(" ", "   ")} `)).toEqual({ statut: "enregistre", nom });
      expect(await chefDuCompte(pool, compte.id)).toEqual({ nom });
      const { rows } = await pool.query("select cle_nom from chef where compte_id = $1", [compte.id]);
      expect(rows[0].cle_nom).toBe(cleDuNom(nom));
    });

    it("refait toutes les règles, sans rien enregistrer d'un nom refusé", async () => {
      const compte = await nouveauCompte();
      expect(await enregistrerNomDeChef(pool, compte.id, "Ou")).toEqual({ statut: "refuse", erreur: NOM_TROP_COURT });
      expect(await enregistrerNomDeChef(pool, compte.id, "Loup@")).toEqual({ statut: "refuse", erreur: caractereRefuse("@") });
      expect(await enregistrerNomDeChef(pool, compte.id, "    ")).toEqual({ statut: "refuse", erreur: NOM_TROP_COURT });
      expect(await chefDuCompte(pool, compte.id)).toBeNull();
    });

    it("dit qu'un nom est pris, majuscules, accents et signes mis à part", async () => {
      const premier = await nouveauCompte();
      const second = await nouveauCompte();
      const nom = nomUnique("Élan");
      await enregistrerNomDeChef(pool, premier.id, nom.replace("Élan", "Elan"));
      expect(await enregistrerNomDeChef(pool, second.id, nom.toUpperCase())).toEqual({ statut: "pris" });
      expect(await chefDuCompte(pool, second.id)).toBeNull();
    });

    /** Des connexions déjà ouvertes : sinon leur ouverture, une à une, étalerait la rafale. */
    const chaufferLePool = () => Promise.all(Array.from({ length: 10 }, () => pool.query("select pg_sleep(0.2)")));

    it("ne donne le nom qu'à un seul des chefs qui le veulent au même instant", async () => {
      const comptes = await Promise.all(Array.from({ length: 10 }, () => nouveauCompte()));
      const nom = nomUnique("Rafale");
      await chaufferLePool();
      const resultats = await Promise.all(comptes.map((compte) => enregistrerNomDeChef(pool, compte.id, nom)));
      expect(resultats.filter((r) => r.statut === "enregistre")).toHaveLength(1);
      expect(resultats.filter((r) => r.statut === "pris")).toHaveLength(9);
      const { rows } = await pool.query("select count(*)::int as n from chef where cle_nom = $1", [cleDuNom(nom)]);
      expect(rows[0].n).toBe(1);
    });

    it("traite un double appui du même joueur comme un seul", async () => {
      const compte = await nouveauCompte();
      const nom = nomUnique("Double");
      await chaufferLePool();
      const resultats = await Promise.all([enregistrerNomDeChef(pool, compte.id, nom), enregistrerNomDeChef(pool, compte.id, nom)]);
      expect(resultats).toEqual([
        { statut: "enregistre", nom },
        { statut: "enregistre", nom },
      ]);
      const { rows } = await pool.query("select count(*)::int as n from chef where compte_id = $1", [compte.id]);
      expect(rows[0].n).toBe(1);
    });
  });

  describe("noms interdits, avec la liste de la base (US-0138)", () => {
    it.each(["Connard42", "Bestia Officiel", "BestiaTeam", "Le Con", "Admin", "P3d0", "Salooope", "C-o-n-n-a-r-d"])("refuse « %s »", async (nom) => {
      expect(await nomInterdit(pool, nom)).toBe(true);
    });

    it.each(["Conquête", "Faucon", "Leçon", "Dispute", "Badminton", "Communiquer", "Unique", "Violon", "Pornic", "Habite", "Nazim", "Niger", "Fagot", "Kaki", "Dickens", "Culotte", "Ourse"])(
      "laisse passer « %s »",
      async (nom) => {
        expect(await nomInterdit(pool, nom)).toBe(false);
      },
    );

    it("refuse un nom interdit à l'enregistrement, sans rien enregistrer", async () => {
      const compte = await nouveauCompte();
      expect(await enregistrerNomDeChef(pool, compte.id, "Connard42")).toEqual({ statut: "refuse", erreur: NOM_NON_AUTORISE });
      expect(await chefDuCompte(pool, compte.id)).toBeNull();
    });
  });

  describe("naître sur la Couronne (US-0153)", () => {
    /** La Case possédée par le chef d'un compte. */
    const caseDu = async (compteId: number) => {
      const { rows } = await pool.query(
        `select c.q, c.r, c.couronne, c.biome_id as biome from case_du_monde c join chef ch on ch.id = c.chef_id where ch.compte_id = $1`,
        [compteId],
      );
      return rows;
    };

    it("donne au nouveau chef une Case libre de la Couronne, en prairie, à lui seul", async () => {
      const compte = await nouveauCompte();
      await enregistrerNomDeChef(pool, compte.id, nomUnique("Naissance"));
      const cases = await caseDu(compte.id);
      expect(cases).toHaveLength(1);
      expect(cases[0]).toMatchObject({ couronne: true, biome: "prairie" });
    });

    it("fait naître le chef suivant tout près du dernier arrivé, à 4 Cases au moins", async () => {
      const premier = await nouveauCompte();
      const second = await nouveauCompte();
      await enregistrerNomDeChef(pool, premier.id, nomUnique("Aîné"));
      await enregistrerNomDeChef(pool, second.id, nomUnique("Cadet"));
      const [a] = await caseDu(premier.id);
      const [b] = await caseDu(second.id);
      expect(distance(a, b)).toBeGreaterThanOrEqual(4);
      expect(distance(a, b)).toBeLessThanOrEqual(15);
    });

    it("ne donne qu'une Case pour un double appui, et aucune à qui n'obtient pas le nom", async () => {
      const compte = await nouveauCompte();
      const autre = await nouveauCompte();
      const nom = nomUnique("Unique");
      await Promise.all([enregistrerNomDeChef(pool, compte.id, nom), enregistrerNomDeChef(pool, compte.id, nom), enregistrerNomDeChef(pool, autre.id, nom)]);
      expect(await caseDu(compte.id)).toHaveLength(1);
      expect(await caseDu(autre.id)).toHaveLength(0);
    });

    it("donne des Cases différentes, bien espacées, à des chefs qui naissent au même instant", async () => {
      const comptes = await Promise.all(Array.from({ length: 8 }, () => nouveauCompte()));
      await Promise.all(Array.from({ length: 10 }, () => pool.query("select pg_sleep(0.2)")));
      const noms = ["Abeille", "Bison", "Castor", "Daim", "Écureuil", "Faon", "Gerboise", "Hérisson"];
      await Promise.all(comptes.map((compte, i) => enregistrerNomDeChef(pool, compte.id, nomUnique(noms[i]))));
      const cases = (await Promise.all(comptes.map((compte) => caseDu(compte.id)))).map((c) => c[0]);
      expect(cases.every(Boolean)).toBe(true);
      for (const [i, a] of cases.entries()) for (const b of cases.slice(i + 1)) expect(distance(a, b)).toBeGreaterThanOrEqual(4);
    });

    it("donne 30 Cases différentes, toutes bien espacées, à 30 chefs qui naissent au même instant (US-0154)", async () => {
      const comptes = await Promise.all(Array.from({ length: 30 }, () => nouveauCompte()));
      await Promise.all(Array.from({ length: 10 }, () => pool.query("select pg_sleep(0.2)")));
      const resultats = await Promise.all(comptes.map((compte, i) => enregistrerNomDeChef(pool, compte.id, nomUnique(`Rafale${String.fromCharCode(97 + i % 26)}${i >= 26 ? "z" : ""}`))));
      expect(resultats.every((r) => r.statut === "enregistre")).toBe(true);
      const cases = (await Promise.all(comptes.map((compte) => caseDu(compte.id)))).map((c) => c[0]);
      expect(new Set(cases.map((c) => `${c.q},${c.r}`)).size).toBe(30);
      for (const [i, a] of cases.entries()) for (const b of cases.slice(i + 1)) expect(distance(a, b)).toBeGreaterThanOrEqual(4);
    }, 30_000);

    it("libère la Case d'un compte supprimé", async () => {
      const compte = await nouveauCompte();
      await enregistrerNomDeChef(pool, compte.id, nomUnique("Passant"));
      const [c] = await caseDu(compte.id);
      await pool.query("delete from compte where id = $1", [compte.id]);
      const { rows } = await pool.query("select chef_id from case_du_monde where q = $1 and r = $2 and monde_id = (select id from monde order by id limit 1)", [c.q, c.r]);
      expect(rows[0].chef_id).toBeNull();
    });
  });
});

