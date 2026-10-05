// Le Chef d'un compte (US-0131) : le nom sous lequel les autres joueurs du Monde le voient.
// Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { DatabaseError } from "pg";
import { choisirCaseDeNaissance } from "@/monde/foyers";
import { nomInterditPar, type MotInterdit } from "./interdits";
import { cleDuNom, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "./nom";

/** Le Monde du jeu : le seul pour l'instant, le premier ouvert. */
const MONDE_DU_JEU = "(select id from monde order by id limit 1)";

/** Le Chef du compte dans le Monde du jeu, ou null tant qu'il n'a pas choisi son nom. */
export async function chefDuCompte(pool: Pool, compteId: number): Promise<{ nom: string } | null> {
  const { rows } = await pool.query<{ nom: string }>(`select nom from chef where compte_id = $1 and monde_id = ${MONDE_DU_JEU}`, [compteId]);
  return rows[0] ?? null;
}

/** Si le nom contient un mot de la liste des mots interdits, lue en base à chaque fois (US-0138). */
export async function nomInterdit(pool: Pool, nom: string): Promise<boolean> {
  const { rows } = await pool.query<MotInterdit>("select mot, entier from mot_interdit");
  return nomInterditPar(nom, rows);
}

/** Si un Chef du Monde du jeu porte déjà ce nom, majuscules, accents et signes mis à part (US-0135). */
export async function nomDejaPris(pool: Pool, nom: string): Promise<boolean> {
  const cle = cleDuNom(nom);
  if (!cle) return false;
  const { rows } = await pool.query<{ pris: boolean }>(
    `select exists (select 1 from chef where monde_id = ${MONDE_DU_JEU} and cle_nom = $1) as pris`,
    [cle],
  );
  return rows[0].pris;
}

export type Enregistrement =
  | { statut: "enregistre"; nom: string }
  | { statut: "refuse"; erreur: string }
  | { statut: "pris" }
  | { statut: "complet"; monde: string };

/** La clé du verrou des naissances : une naissance à la fois dans un même Monde. */
const VERROU_NAISSANCE = 153;

/**
 * Donne au compte son nom de chef dans le Monde du jeu (US-0137) et sa Case sur la Couronne
 * (US-0153), ensemble ou pas du tout. La saisie est nettoyée et repasse par toutes les règles,
 * mots interdits compris (US-0138). Les naissances d'un Monde passent l'une après l'autre : si
 * deux joueurs veulent le même nom au même instant, un seul l'obtient, l'autre reçoit « pris » ;
 * et deux nouveaux chefs ne visent jamais la même Case. Un double appui du même joueur n'est pas
 * un conflit : il retrouve le chef créé par le premier.
 */
export async function enregistrerNomDeChef(pool: Pool, compteId: number, saisie: string, hasard: () => number = Math.random): Promise<Enregistrement> {
  const nom = nettoyerNom(saisie);
  const erreur = verifierNomDeChef(nom);
  if (erreur) return { statut: "refuse", erreur };
  if (await nomInterdit(pool, nom)) return { statut: "refuse", erreur: NOM_NON_AUTORISE };
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows: mondes } = await client.query<{ id: number; nom: string }>(`select id, nom from monde where id = ${MONDE_DU_JEU}`);
    const monde = mondes[0];
    await client.query("select pg_advisory_xact_lock($1, $2)", [VERROU_NAISSANCE, monde.id]);
    const { rows: existant } = await client.query<{ nom: string }>("select nom from chef where compte_id = $1 and monde_id = $2", [compteId, monde.id]);
    if (existant[0]) {
      await client.query("commit");
      return { statut: "enregistre", nom: existant[0].nom };
    }
    const { rows: doublon } = await client.query("select 1 from chef where monde_id = $1 and cle_nom = $2", [monde.id, cleDuNom(nom)]);
    if (doublon[0]) {
      await client.query("rollback");
      return { statut: "pris" };
    }
    const naissance = await caseDeNaissance(client, monde.id, hasard);
    if (!naissance) {
      await client.query("rollback");
      return { statut: "complet", monde: monde.nom };
    }
    const { rows: chefs } = await client.query<{ id: number }>("insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, $3, $4) returning id", [
      compteId,
      monde.id,
      nom,
      cleDuNom(nom),
    ]);
    const { rowCount } = await client.query("update case_du_monde set chef_id = $1 where id = $2 and chef_id is null", [chefs[0].id, naissance.id]);
    if (rowCount !== 1) throw new Error(`La Case ${naissance.id} n'est plus libre.`);
    await client.query("commit");
    return { statut: "enregistre", nom };
  } catch (refus) {
    await client.query("rollback").catch(() => {});
    // Par sécurité, si la base tranche malgré le verrou : un nom déjà pris reste « pris ».
    if (refus instanceof DatabaseError && refus.code === "23505") {
      const chef = await chefDuCompte(pool, compteId);
      if (chef) return { statut: "enregistre", nom: chef.nom };
      if (refus.constraint === "chef_nom_unique_dans_le_monde") return { statut: "pris" };
    }
    throw refus;
  } finally {
    client.release();
  }
}

/**
 * La Case libre de la Couronne où naît le nouveau chef (US-0153), ou null si elle est pleine. Les
 * Foyers déjà nés sont pour l'instant toutes les Cases possédées, chaque chef n'en ayant qu'une.
 */
async function caseDeNaissance(client: PoolClient, mondeId: number, hasard: () => number): Promise<{ id: number } | null> {
  const { rows: cases } = await client.query<{ id: number; q: number; r: number; biome: string; possedee: boolean }>(
    "select id, q, r, biome_id as biome, chef_id is not null as possedee from case_du_monde where monde_id = $1 and couronne",
    [mondeId],
  );
  const { rows: foyers } = await client.query<{ q: number; r: number }>(
    `select c.q, c.r from case_du_monde c join chef ch on ch.id = c.chef_id
     where c.monde_id = $1 order by ch.cree_le desc, ch.id desc`,
    [mondeId],
  );
  return choisirCaseDeNaissance(cases, foyers, foyers[0] ?? null, hasard);
}
