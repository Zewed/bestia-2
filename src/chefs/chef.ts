// Le Chef d'un compte (US-0131) : le nom sous lequel les autres joueurs du Monde le voient.
// Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { DatabaseError } from "pg";
import { choisirCaseDeNaissance } from "@/monde/foyers";
import { maintenant } from "@/temps/horloge";
import { nomInterditPar, type MotInterdit } from "./interdits";
import { cleDuNom, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "./nom";

/** Le Monde du jeu : le seul pour l'instant, le premier ouvert. */
const MONDE_DU_JEU = "(select id from monde order by id limit 1)";

/**
 * Le Chef du compte dans le Monde du jeu, avec son Territoire (null pour un chef né avant les
 * Territoires), ou null tant qu'il n'a pas choisi son nom.
 */
export async function chefDuCompte(pool: Pool, compteId: number): Promise<{ nom: string; territoireId: number | null } | null> {
  const { rows } = await pool.query<{ nom: string; territoireId: number | null }>(
    `select ch.nom, t.id as "territoireId" from chef ch left join territoire t on t.chef_id = ch.id
     where ch.compte_id = $1 and ch.monde_id = ${MONDE_DU_JEU}`,
    [compteId],
  );
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
 * Donne au compte son nom de chef dans le Monde du jeu (US-0137), sa Case sur la Couronne
 * (US-0153), et son Territoire, qui n'a qu'une Case : son Foyer, imprenable (US-0155). Tout
 * naît ensemble ou rien. La saisie est nettoyée et repasse par toutes les règles,
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
    // Le verrou des naissances est pris dans la même requête que le Monde : six allers-retours en tout.
    const { rows: mondes } = await client.query<{ id: number; nom: string }>(
      `select id, nom, pg_advisory_xact_lock($1, id) from monde where id = ${MONDE_DU_JEU}`,
      [VERROU_NAISSANCE],
    );
    const monde = mondes[0];
    const { rows: deja } = await client.query<{ existant: string | null; doublon: boolean }>(
      `select (select nom from chef where compte_id = $1 and monde_id = $2) as existant,
         exists (select 1 from chef where monde_id = $2 and cle_nom = $3) as doublon`,
      [compteId, monde.id, cleDuNom(nom)],
    );
    if (deja[0].existant !== null) {
      await client.query("commit");
      return { statut: "enregistre", nom: deja[0].existant };
    }
    if (deja[0].doublon) {
      await client.query("rollback");
      return { statut: "pris" };
    }
    const naissance = await caseDeNaissance(client, monde.id, hasard);
    if (!naissance) {
      await client.query("rollback");
      return { statut: "complet", monde: monde.nom };
    }
    // Le chef, sa Case devenue Foyer imprenable et son Territoire, en une seule requête. Le marque-page
    // du temps du Territoire part de sa naissance, à l'heure du jeu (US-0156).
    const { rowCount } = await client.query(
      `with nouveau as (
         insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, $3, $4) returning id
       ), prise as (
         update case_du_monde set chef_id = (select id from nouveau), imprenable = true
         where id = $5 and chef_id is null returning id
       )
       insert into territoire (chef_id, foyer_case_id, ne_le, calcule_jusqu_a) select nouveau.id, prise.id, $6, $6 from nouveau, prise`,
      [compteId, monde.id, nom, cleDuNom(nom), naissance.id, maintenant()],
    );
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
 * La Case libre de la Couronne où naît le nouveau chef (US-0153), ou null si elle est pleine,
 * loin des Foyers des Territoires déjà nés et près du dernier arrivé.
 */
async function caseDeNaissance(client: PoolClient, mondeId: number, hasard: () => number): Promise<{ id: number } | null> {
  // Seules les prairies libres peuvent accueillir un Foyer : inutile de lire le reste de la Couronne.
  const { rows } = await client.query<{ libres: { id: number; q: number; r: number; biome: string }[] | null; foyers: { q: number; r: number }[] | null }>(
    `select
       (select json_agg(json_build_object('id', id, 'q', q, 'r', r, 'biome', biome_id))
        from case_du_monde where monde_id = $1 and couronne and biome_id = 'prairie' and chef_id is null) as libres,
       (select json_agg(json_build_object('q', c.q, 'r', c.r) order by ch.cree_le desc, ch.id desc)
        from territoire t join case_du_monde c on c.id = t.foyer_case_id join chef ch on ch.id = t.chef_id
        where c.monde_id = $1) as foyers`,
    [mondeId],
  );
  const foyers = rows[0].foyers ?? [];
  return choisirCaseDeNaissance(rows[0].libres ?? [], foyers, foyers[0] ?? null, hasard);
}
