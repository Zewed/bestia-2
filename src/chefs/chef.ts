// Le Chef d'un compte (US-0131) : le nom sous lequel les autres joueurs du Monde le voient.
// Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { DatabaseError } from "pg";
import { MONDE_DU_JEU, VERROU_DES_NAISSANCES } from "@/monde/bascule";
import { poserLesBetesDeNaissance } from "@/monde/betes-de-naissance";
import { abordsDuFoyer, decouvrir } from "@/monde/brouillard";
import { alerteDePlaces, choisirCaseDeNaissance, emplacementsDeFoyers } from "@/monde/foyers";
import type { Coordonnees } from "@/monde/hex";
import { maintenant } from "@/temps/horloge";
import { nomInterditPar, type MotInterdit } from "./interdits";
import { cleDuNom, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "./nom";

export type ChefDuCompte = { nom: string; territoireId: number | null; recitLu: boolean; betesAttendues: boolean };

/**
 * Le Chef du compte dans le Monde du jeu, avec son Territoire (null pour un chef né avant les
 * Territoires) et si son récit d'arrivée a été montré, ou null tant qu'il n'a pas choisi son nom.
 * US-0975 : et si son Territoire attend encore ses Bêtes de naissance (né avant elles, ou après une bascule).
 */
export async function chefDuCompte(pool: Pool, compteId: number): Promise<ChefDuCompte | null> {
  const { rows } = await pool.query<ChefDuCompte>(
    `select ch.nom, t.id as "territoireId", coalesce(t.recit_lu_le is not null, false) as "recitLu",
       t.id is not null and t.betes_de_naissance_le is null as "betesAttendues"
     from chef ch left join territoire t on t.chef_id = ch.id
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

/**
 * US-0208 : le chef d'un nom dans le Monde du jeu, majuscules, accents et signes mis à part (comme
 * pour les noms en double), avec son Territoire (null s'il n'en a pas encore) ; null si personne.
 */
export async function chefParNom(pool: Pool, saisie: string): Promise<{ nom: string; territoireId: number | null } | null> {
  const cle = cleDuNom(nettoyerNom(saisie));
  if (!cle) return null;
  const { rows } = await pool.query<{ nom: string; territoireId: number | null }>(
    `select ch.nom, t.id as "territoireId" from chef ch left join territoire t on t.chef_id = ch.id
     where ch.monde_id = ${MONDE_DU_JEU} and ch.cle_nom = $1`,
    [cle],
  );
  return rows[0] ?? null;
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
  | { statut: "complet" };

/**
 * Donne au compte son nom de chef dans le Monde du jeu (US-0137), sa Case sur la Couronne
 * (US-0153), et son Territoire, qui n'a qu'une Case : son Foyer, imprenable (US-0155). Tout
 * naît ensemble ou rien. La saisie est nettoyée et repasse par toutes les règles,
 * mots interdits compris (US-0138). Les naissances passent l'une après l'autre : si
 * deux joueurs veulent le même nom au même instant, un seul l'obtient, l'autre reçoit « pris » ;
 * et deux nouveaux chefs ne visent jamais la même Case. Un double appui du même joueur n'est pas
 * un conflit : il retrouve le chef créé par le premier. US-0414 : le chef naît dans le Monde du
 * jeu, le Monde ouvert, ou dans le Monde `mondeId` pour les essais. US-0436 : son Territoire naît
 * en ne découvrant que les abords de son Foyer ; tout le reste du Monde est sous le brouillard.
 * US-0975 : et ses Bêtes de naissance se posent autour de son Foyer, dans la même transaction.
 */
export async function enregistrerNomDeChef(
  pool: Pool,
  compteId: number,
  saisie: string,
  hasard: () => number = Math.random,
  mondeId: number | null = null,
): Promise<Enregistrement> {
  const nom = nettoyerNom(saisie);
  const erreur = verifierNomDeChef(nom);
  if (erreur) return { statut: "refuse", erreur };
  if (await nomInterdit(pool, nom)) return { statut: "refuse", erreur: NOM_NON_AUTORISE };
  const client = await pool.connect();
  try {
    await client.query("begin");
    // US-0414 : le Monde n'est lu qu'une fois le verrou des naissances obtenu, avec ce qu'il sait déjà de ce compte et
    // de ce nom (neuf allers-retours en tout, abords du Foyer et Bêtes de naissance compris) : une naissance qui
    // attendait la fin d'une bascule vise le nouveau Monde.
    await client.query("select pg_advisory_xact_lock($1)", [VERROU_DES_NAISSANCES]);
    const { rows: mondes } = await client.query<{ id: number; nom: string; existant: string | null; doublon: boolean }>(
      `select m.id, m.nom, (select nom from chef where compte_id = $1 and monde_id = m.id) as existant,
         exists (select 1 from chef where monde_id = m.id and cle_nom = $2) as doublon
       from monde m where m.id = coalesce($3, ${MONDE_DU_JEU})`,
      [compteId, cleDuNom(nom), mondeId],
    );
    const monde = mondes[0];
    if (monde.existant !== null) {
      await client.query("commit");
      return { statut: "enregistre", nom: monde.existant };
    }
    if (monde.doublon) {
      await client.query("rollback");
      return { statut: "pris" };
    }
    const naissance = await caseDeNaissance(client, monde.id, hasard);
    // US-0159 : l'équipe est prévenue dans le journal quand le Monde se remplit.
    const alerte = alerteDePlaces(monde.nom, naissance?.restantes ?? 0);
    if (alerte) console.error(alerte);
    if (!naissance) {
      await client.query("rollback");
      return { statut: "complet" };
    }
    // Le chef, sa Case devenue Foyer imprenable et son Territoire, en une seule requête. Le marque-page
    // du temps du Territoire part de sa naissance, à l'heure du jeu (US-0156).
    const instant = maintenant();
    const { rows } = await client.query<{ id: number }>(
      `with nouveau as (
         insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, $2, $3, $4) returning id
       ), prise as (
         update case_du_monde set chef_id = (select id from nouveau), imprenable = true
         where id = $5 and chef_id is null returning id
       )
       insert into territoire (chef_id, foyer_case_id, ne_le, calcule_jusqu_a) select nouveau.id, prise.id, $6, $6 from nouveau, prise
       returning id`,
      [compteId, monde.id, nom, cleDuNom(nom), naissance.id, instant],
    );
    if (!rows[0]) throw new Error(`La Case ${naissance.id} n'est plus libre.`);
    // US-0436 : le Territoire naît en ne découvrant que les abords de son Foyer, dans la même transaction.
    await decouvrir(client, rows[0].id, abordsDuFoyer(naissance));
    // US-0975 : ses Bêtes de naissance arrivent avec lui.
    await poserLesBetesDeNaissance(client, rows[0].id, instant, hasard);
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
 * Donne un Foyer à un chef qui n'en a pas (US-0160) : depuis US-0153, le nom et le Foyer naissent
 * ensemble, mais un chef né avant reçoit le sien à son retour, comme à une naissance ordinaire.
 * Rend le Territoire du chef (déjà là ou tout juste né), ou null si le Monde est complet.
 */
export async function naitreSurLaCouronne(pool: Pool, compteId: number, hasard: () => number = Math.random): Promise<number | null> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock($1)", [VERROU_DES_NAISSANCES]);
    const { rows: mondes } = await client.query<{ id: number; nom: string }>(`select id, nom from monde where id = ${MONDE_DU_JEU}`);
    const monde = mondes[0];
    const { rows: chefs } = await client.query<{ id: number; territoireId: number | null }>(
      `select ch.id, t.id as "territoireId" from chef ch left join territoire t on t.chef_id = ch.id
       where ch.compte_id = $1 and ch.monde_id = $2`,
      [compteId, monde.id],
    );
    const chef = chefs[0];
    if (!chef || chef.territoireId !== null) {
      await client.query("commit");
      return chef?.territoireId ?? null;
    }
    const naissance = await caseDeNaissance(client, monde.id, hasard);
    const alerte = alerteDePlaces(monde.nom, naissance?.restantes ?? 0);
    if (alerte) console.error(alerte);
    if (!naissance) {
      await client.query("rollback");
      return null;
    }
    const instant = maintenant();
    const { rows } = await client.query<{ id: number }>(
      `with prise as (
         update case_du_monde set chef_id = $1, imprenable = true where id = $2 and chef_id is null returning id
       )
       insert into territoire (chef_id, foyer_case_id, ne_le, calcule_jusqu_a) select $1, prise.id, $3, $3 from prise returning id`,
      [chef.id, naissance.id, instant],
    );
    if (!rows[0]) throw new Error(`La Case ${naissance.id} n'est plus libre.`);
    // US-0436 : comme à une naissance ordinaire, il ne découvre que les abords de son Foyer.
    await decouvrir(client, rows[0].id, abordsDuFoyer(naissance));
    // US-0975 : et ses Bêtes de naissance arrivent avec lui.
    await poserLesBetesDeNaissance(client, rows[0].id, instant, hasard);
    await client.query("commit");
    return rows[0].id;
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * La Case libre de la Couronne où naît le nouveau chef (US-0153), ou null si elle est pleine,
 * loin des Foyers des Territoires déjà nés et près du dernier arrivé ; avec le nombre de places
 * de Foyer qui resteront ensuite (US-0159). US-0436 : et sa place, pour en découvrir les abords.
 */
async function caseDeNaissance(client: PoolClient, mondeId: number, hasard: () => number): Promise<(Coordonnees & { id: number; restantes: number }) | null> {
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
  const libres = rows[0].libres ?? [];
  const choisie = choisirCaseDeNaissance(libres, foyers, foyers[0] ?? null, hasard);
  if (!choisie) return null;
  // Les places qui resteront après cette naissance, estimées comme sur la page de contrôle.
  const restantes = emplacementsDeFoyers(libres.filter((c) => c.id !== choisie.id), [choisie, ...foyers]).length;
  return { id: choisie.id, q: choisie.q, r: choisie.r, restantes };
}
