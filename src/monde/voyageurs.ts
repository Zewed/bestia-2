// Les Voyageurs (US-0331) : des humains de passage qui se présentent de temps en temps aux portes d'un
// Territoire, et y attendent. Côté serveur uniquement. US-0337 : un Voyageur ne s'efface jamais ; tant qu'il
// attend aux portes, il n'a pas de sort (sort is null), puis il est accueilli, refusé, ou reparti de lui-même.
import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { VOYAGEUR_ATTEND_HEURES, VOYAGEUR_TOUTES_LES_HEURES, VOYAGEURS_EN_ATTENTE_MAX } from "@/reglages";
import { programmerEvenement, type Evenement } from "@/temps/avancer";
import { ajouterUnHabitant } from "./habitants";
import { ecrireUnRecit, type NouveauRecit } from "./recits";

/** US-0331 : l'événement d'une arrivée ; ses données portent son numéro, 1 pour la première du Territoire. */
export const ARRIVEE_VOYAGEUR = "arrivee_voyageur";

/** US-0337 : l'événement du départ d'un Voyageur au bout de son attente ; ses données portent son identifiant. */
export const DEPART_VOYAGEUR = "depart_voyageur";

/** US-0331 : l'écart moyen entre deux arrivées, en millisecondes de jeu. */
const MOYENNE_MS = Math.round(VOYAGEUR_TOUTES_LES_HEURES * 3_600_000);

/**
 * US-0331 : l'écart, en millisecondes de jeu, avant l'arrivée `numero` d'un Territoire (la première comptée
 * depuis sa naissance, les suivantes depuis la précédente) : tiré uniformément de la moitié à une fois et demie
 * la moyenne, par un hachage du Territoire et du numéro plutôt qu'au hasard. Le même Territoire voit ainsi
 * toujours la même suite d'arrivées, quel que soit le découpage du rattrapage. La base fait le même tirage
 * pour la première arrivée (fonction ecart_avant_voyageur, migration 0038).
 */
export function ecartAvantVoyageur(territoireId: number, numero: number): number {
  const tirage = createHash("md5").update(`${territoireId}:${numero}`).digest().readUInt32BE(0);
  // moyenne × (2³¹ + tirage) / 2³², en entiers exacts, comme la base le calcule.
  return Number((BigInt(MOYENNE_MS) * (BigInt(2 ** 31) + BigInt(tirage))) / BigInt(2 ** 32));
}

/**
 * US-0331 : un Voyageur se présente au Territoire $1 à l'instant $2, avec un prénom tiré au hasard dans la
 * table prenom, différent de ceux de ses Habitants et des Voyageurs qui attendent (si tous sont pris, un
 * prénom déjà porté plutôt que rien) ; s'il en attend déjà $3, personne ne se présente. Rend son identifiant
 * quand il se présente. US-0337 : seuls comptent ceux qui attendent encore aux portes.
 */
const FAIRE_ENTRER = `
  insert into voyageur (territoire_id, prenom, arrive_le)
  select $1, tire.nom, $2
  from (
    select p.nom from prenom p
    order by exists (select 1 from habitant h where h.territoire_id = $1 and h.prenom = p.nom)
      or exists (select 1 from voyageur v where v.territoire_id = $1 and v.sort is null and v.prenom = p.nom), random()
    limit 1
  ) tire
  where (select count(*) from voyageur where territoire_id = $1 and sort is null) < $3
  returning id`;

/**
 * US-0331 : l'arrivée d'un Voyageur, à son instant. Il se présente s'il reste de la place aux portes ; sinon
 * personne ne vient, et l'arrivée est perdue, pas reportée. Dans les deux cas, l'arrivée suivante est
 * programmée : le temps qui avance l'applique à son tour, dans la même avancée si elle tombe avant sa fin.
 * US-0337 : le Voyageur qui se présente reçoit aussitôt son départ, au bout de son attente, programmé avant
 * l'arrivée suivante : tombés au même instant, le départ passe le premier et libère sa place.
 */
export async function arriveeDUnVoyageur(client: PoolClient, territoireId: number, evenement: Evenement): Promise<void> {
  const numero = evenement.donnees.numero;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1) {
    throw new Error(`Arrivée de Voyageur sans numéro valable pour le Territoire ${territoireId}.`);
  }
  const { rows } = await client.query<{ id: number }>(FAIRE_ENTRER, [territoireId, evenement.survientLe, VOYAGEURS_EN_ATTENTE_MAX]);
  if (rows[0]) {
    await programmerEvenement(client, "territoire", territoireId, departDuVoyageur(evenement.survientLe), DEPART_VOYAGEUR, { voyageur: rows[0].id });
  }
  const suivante = new Date(evenement.survientLe.getTime() + ecartAvantVoyageur(territoireId, numero + 1));
  await programmerEvenement(client, "territoire", territoireId, suivante, ARRIVEE_VOYAGEUR, { numero: numero + 1 });
}

/**
 * US-0333 : l'instant où un Voyageur arrivé à `arriveLe` repart s'il n'a pas été accueilli, VOYAGEUR_ATTEND_HEURES
 * heures de jeu plus tard. La seule règle de son départ : la page en tire le compte à rebours, et le départ
 * lui-même (US-0337) est programmé à cet instant. La migration 0041 programme celui des Voyageurs déjà aux portes
 * avec la même durée : la changer demande une migration qui déplace les départs à venir.
 */
export function departDuVoyageur(arriveLe: Date): Date {
  return new Date(arriveLe.getTime() + VOYAGEUR_ATTEND_HEURES * 3_600_000);
}

/** US-0337 : le Voyageur dont un événement de départ annonce le départ. */
function voyageurDuDepart(territoireId: number, evenement: Evenement): number {
  const voyageurId = evenement.donnees.voyageur;
  if (typeof voyageurId !== "number" || !Number.isInteger(voyageurId) || voyageurId < 1) {
    throw new Error(`Départ de Voyageur sans Voyageur valable pour le Territoire ${territoireId}.`);
  }
  return voyageurId;
}

/**
 * US-0337 : le départ d'un Voyageur, à la fin de son attente : s'il attend toujours aux portes, il repart de
 * lui-même, à cet instant ; accueilli ou refusé d'ici là, il garde son sort, et rien ne se passe. Un Voyageur
 * d'un autre Territoire n'est jamais touché. Le Récit vient à la fin de l'avancée (raconterLesDeparts).
 */
export async function departDUnVoyageur(client: PoolClient, territoireId: number, evenement: Evenement): Promise<void> {
  await client.query("update voyageur set sort = 'reparti', sort_le = $3 where id = $2 and territoire_id = $1 and sort is null", [
    territoireId,
    voyageurDuDepart(territoireId, evenement),
    evenement.survientLe,
  ]);
}

/** US-0337 : « Ines », « Ines et Joran », « Ines, Joran et Ilda ». */
function enumerer(prenoms: string[]): string {
  return prenoms.length > 1 ? `${prenoms.slice(0, -1).join(", ")} et ${prenoms.at(-1)}` : prenoms[0];
}

/**
 * US-0337 : le Récit des Voyageurs repartis sans avoir été accueillis, dans l'ordre de leurs départs, daté de
 * `instant`, celui du dernier : « Ines a repris la route » ; à plusieurs, « 3 Voyageurs ont repris la route »,
 * leurs prénoms dans le texte. Comme pour l'accueil, la phrase ne donne de genre à personne.
 */
export function recitDeDepart(prenoms: string[], instant: Date): NouveauRecit {
  const seul = prenoms.length === 1;
  return {
    titre: seul ? `${prenoms[0]} a repris la route` : `${prenoms.length} Voyageurs ont repris la route`,
    texte: `${enumerer(prenoms)} ${seul ? "a" : "ont"} attendu aux portes sans qu'on ${seul ? "l'" : "les "}accueille.`,
    survenuLe: instant,
  };
}

/**
 * US-0337 : la conclusion de chaque avancée du temps d'un Territoire : les Voyageurs que ses départs ont fait
 * repartir, dans l'ordre de leurs départs, sont dits dans un seul Récit, daté du dernier. Une absence rattrapée
 * d'un bloc les regroupe tous ; page ouverte, chaque départ a le sien. Sans départ, rien n'est lu.
 */
export async function raconterLesDeparts(client: PoolClient, territoireId: number, appliques: Evenement[]): Promise<void> {
  const departs = appliques.filter((e) => e.type === DEPART_VOYAGEUR).map((e) => voyageurDuDepart(territoireId, e));
  if (departs.length === 0) return;
  const { rows } = await client.query<{ prenom: string; sortLe: Date }>(
    `select prenom, sort_le as "sortLe" from voyageur where territoire_id = $1 and id = any($2) and sort = 'reparti' order by sort_le, id`,
    [territoireId, departs],
  );
  if (rows.length === 0) return;
  await ecrireUnRecit(
    client,
    territoireId,
    recitDeDepart(
      rows.map((v) => v.prenom),
      rows.at(-1)!.sortLe,
    ),
  );
}

/**
 * US-0332 : un Voyageur qui attend aux portes : son prénom et l'heure du jeu de son arrivée ; US-0333 : et celle
 * de son départ.
 */
export type VoyageurAuxPortes = { id: number; prenom: string; arriveLe: Date; departLe: Date };

/** US-0332 : les Voyageurs qui attendent aux portes du Territoire, du premier arrivé au dernier ; US-0337 : ceux sans sort. */
export async function voyageursAuxPortes(base: Pool | PoolClient, territoireId: number): Promise<VoyageurAuxPortes[]> {
  const { rows } = await base.query<Omit<VoyageurAuxPortes, "departLe">>(
    `select id, prenom, arrive_le as "arriveLe" from voyageur where territoire_id = $1 and sort is null order by arrive_le, id`,
    [territoireId],
  );
  return rows.map((v) => ({ ...v, departLe: departDuVoyageur(v.arriveLe) }));
}

/** US-0334 : depuis quand un Voyageur attendait, compté comme sur sa ligne aux portes : « moins d'une minute », « 12 min », « 3 h ». */
function attente(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "moins d'une minute";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h`;
}

/**
 * US-0334 : le Récit court de l'accueil d'un Voyageur arrivé aux portes à `arriveLe`, daté de l'accueil. Les
 * prénoms n'ont pas de genre : la phrase n'en donne pas non plus.
 */
export function recitDAccueil(prenom: string, arriveLe: Date, instant: Date): NouveauRecit {
  return {
    titre: `${prenom} a rejoint le Territoire`,
    texte: `${prenom}, qui attendait aux portes depuis ${attente(instant.getTime() - arriveLe.getTime())}, vit désormais au Foyer.`,
    survenuLe: instant,
  };
}

/**
 * Ce qu'a donné un accueil (US-0334) : « accueilli » ; US-0337 : « reparti », le Voyageur est déjà reparti de
 * lui-même ; « absent », il n'attend pas aux portes de ce Territoire (déjà accueilli, refusé, ou d'un autre).
 */
export type Accueil = "accueilli" | "reparti" | "absent";

/**
 * US-0334 : le Voyageur `voyageurId` qui attend aux portes du Territoire devient, à l'instant `instant` (l'heure
 * du jeu), un Habitant sans Métier du même prénom, gratuitement, et un Récit court le dit ; le tout en une
 * transaction. Ne change rien pour un Voyageur qui n'attend plus, ou qui attend aux portes d'un autre Territoire,
 * et le dit (US-0337). Le Voyageur prend son sort avant tout le reste : deux accueils du même Voyageur en même
 * temps, ou un accueil et un refus, se suivent sur sa ligne, et seul le premier le trouve encore aux portes. Un
 * seul Habitant, jamais deux.
 */
export async function accueillirLeVoyageur(pool: Pool, territoireId: number, voyageurId: number, instant: Date): Promise<Accueil> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ prenom: string; arriveLe: Date }>(
      `update voyageur set sort = 'accueilli', sort_le = $3 where id = $2 and territoire_id = $1 and sort is null
       returning prenom, arrive_le as "arriveLe"`,
      [territoireId, voyageurId, instant],
    );
    const voyageur = rows[0];
    if (!voyageur) {
      // US-0337 : déjà reparti de lui-même, ou plus aux portes de ce Territoire pour une autre raison.
      const { rows: parti } = await client.query<{ sort: string }>("select sort from voyageur where id = $2 and territoire_id = $1", [territoireId, voyageurId]);
      await client.query("rollback");
      return parti[0]?.sort === "reparti" ? "reparti" : "absent";
    }
    await ajouterUnHabitant(client, territoireId, voyageur.prenom, instant);
    await ecrireUnRecit(client, territoireId, recitDAccueil(voyageur.prenom, voyageur.arriveLe, instant));
    await client.query("commit");
    return "accueilli";
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * US-0336 : le Voyageur `voyageurId` qui attend aux portes du Territoire repart aussitôt, sans Récit, et ne revient
 * pas ; US-0337 : il reste connu, refusé à l'instant `instant` (l'heure du jeu). Sa place aux portes se libère pour
 * la prochaine arrivée. Rend false sans rien changer pour un Voyageur qui n'attend plus (accueilli, refusé ou
 * reparti), ou qui attend aux portes d'un autre Territoire. Refusé et accueilli en même temps, il ne l'est que par
 * le premier des deux.
 */
export async function refuserLeVoyageur(base: Pool | PoolClient, territoireId: number, voyageurId: number, instant: Date): Promise<boolean> {
  const { rowCount } = await base.query("update voyageur set sort = 'refuse', sort_le = $3 where id = $2 and territoire_id = $1 and sort is null", [
    territoireId,
    voyageurId,
    instant,
  ]);
  return rowCount === 1;
}

/** US-0332 : le nombre de Voyageurs qui attendent aux portes, pour le repère de l'entrée « Habitants » ; US-0337 : ceux sans sort. */
export async function nombreDeVoyageurs(base: Pool | PoolClient, territoireId: number): Promise<number> {
  const { rows } = await base.query<{ nombre: number }>("select count(*)::int as nombre from voyageur where territoire_id = $1 and sort is null", [
    territoireId,
  ]);
  return rows[0].nombre;
}
