// Les Voyageurs (US-0331) : des humains de passage qui se présentent de temps en temps aux portes d'un
// Territoire, et y attendent. Côté serveur uniquement.
import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { VOYAGEUR_ATTEND_HEURES, VOYAGEUR_TOUTES_LES_HEURES, VOYAGEURS_EN_ATTENTE_MAX } from "@/reglages";
import { programmerEvenement, type Evenement } from "@/temps/avancer";
import { ajouterUnHabitant } from "./habitants";
import { ecrireUnRecit, type NouveauRecit } from "./recits";

/** US-0331 : l'événement d'une arrivée ; ses données portent son numéro, 1 pour la première du Territoire. */
export const ARRIVEE_VOYAGEUR = "arrivee_voyageur";

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
 * prénom déjà porté plutôt que rien) ; s'il en attend déjà $3, personne ne se présente.
 */
const FAIRE_ENTRER = `
  insert into voyageur (territoire_id, prenom, arrive_le)
  select $1, tire.nom, $2
  from (
    select p.nom from prenom p
    order by exists (select 1 from habitant h where h.territoire_id = $1 and h.prenom = p.nom)
      or exists (select 1 from voyageur v where v.territoire_id = $1 and v.prenom = p.nom), random()
    limit 1
  ) tire
  where (select count(*) from voyageur where territoire_id = $1) < $3`;

/**
 * US-0331 : l'arrivée d'un Voyageur, à son instant. Il se présente s'il reste de la place aux portes ; sinon
 * personne ne vient, et l'arrivée est perdue, pas reportée. Dans les deux cas, l'arrivée suivante est
 * programmée : le temps qui avance l'applique à son tour, dans la même avancée si elle tombe avant sa fin.
 */
export async function arriveeDUnVoyageur(client: PoolClient, territoireId: number, evenement: Evenement): Promise<void> {
  const numero = evenement.donnees.numero;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1) {
    throw new Error(`Arrivée de Voyageur sans numéro valable pour le Territoire ${territoireId}.`);
  }
  await client.query(FAIRE_ENTRER, [territoireId, evenement.survientLe, VOYAGEURS_EN_ATTENTE_MAX]);
  const suivante = new Date(evenement.survientLe.getTime() + ecartAvantVoyageur(territoireId, numero + 1));
  await programmerEvenement(client, "territoire", territoireId, suivante, ARRIVEE_VOYAGEUR, { numero: numero + 1 });
}

/**
 * US-0333 : l'instant où un Voyageur arrivé à `arriveLe` repart s'il n'a pas été accueilli, VOYAGEUR_ATTEND_HEURES
 * heures de jeu plus tard. La seule règle de son départ : la page en tire le compte à rebours, et le départ
 * lui-même (US-0337) la suivra.
 */
export function departDuVoyageur(arriveLe: Date): Date {
  return new Date(arriveLe.getTime() + VOYAGEUR_ATTEND_HEURES * 3_600_000);
}

/**
 * US-0332 : un Voyageur qui attend aux portes : son prénom et l'heure du jeu de son arrivée ; US-0333 : et celle
 * de son départ.
 */
export type VoyageurAuxPortes = { id: number; prenom: string; arriveLe: Date; departLe: Date };

/** US-0332 : les Voyageurs qui attendent aux portes du Territoire, du premier arrivé au dernier. */
export async function voyageursAuxPortes(base: Pool | PoolClient, territoireId: number): Promise<VoyageurAuxPortes[]> {
  const { rows } = await base.query<Omit<VoyageurAuxPortes, "departLe">>(
    `select id, prenom, arrive_le as "arriveLe" from voyageur where territoire_id = $1 order by arrive_le, id`,
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
 * US-0334 : le Voyageur `voyageurId` qui attend aux portes du Territoire devient, à l'instant `instant` (l'heure
 * du jeu), un Habitant sans Métier du même prénom, gratuitement, et un Récit court le dit ; le tout en une
 * transaction. Rend false sans rien changer pour un Voyageur qui n'attend plus (déjà accueilli, ou refusé), ou
 * qui attend aux portes d'un autre Territoire. Le Voyageur est retiré avant tout le reste : deux accueils du
 * même Voyageur en même temps, ou un accueil et un refus, se suivent sur sa ligne, et seul le premier le
 * trouve encore. Un seul Habitant, jamais deux.
 */
export async function accueillirLeVoyageur(pool: Pool, territoireId: number, voyageurId: number, instant: Date): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ prenom: string; arriveLe: Date }>(
      `delete from voyageur where id = $2 and territoire_id = $1 returning prenom, arrive_le as "arriveLe"`,
      [territoireId, voyageurId],
    );
    const voyageur = rows[0];
    if (!voyageur) {
      await client.query("rollback");
      return false;
    }
    await ajouterUnHabitant(client, territoireId, voyageur.prenom, instant);
    await ecrireUnRecit(client, territoireId, recitDAccueil(voyageur.prenom, voyageur.arriveLe, instant));
    await client.query("commit");
    return true;
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * US-0336 : le Voyageur `voyageurId` qui attend aux portes du Territoire repart aussitôt, sans Récit : il n'est
 * plus nulle part, et ne revient pas. Sa place aux portes se libère pour la prochaine arrivée. Rend false sans
 * rien changer pour un Voyageur qui n'attend plus (déjà accueilli, ou refusé), ou qui attend aux portes d'un
 * autre Territoire. Refusé et accueilli en même temps, il ne l'est que par le premier des deux.
 */
export async function refuserLeVoyageur(base: Pool | PoolClient, territoireId: number, voyageurId: number): Promise<boolean> {
  const { rowCount } = await base.query("delete from voyageur where id = $2 and territoire_id = $1", [territoireId, voyageurId]);
  return rowCount === 1;
}

/** US-0332 : le nombre de Voyageurs qui attendent aux portes, pour le repère de l'entrée « Habitants ». */
export async function nombreDeVoyageurs(base: Pool | PoolClient, territoireId: number): Promise<number> {
  const { rows } = await base.query<{ nombre: number }>("select count(*)::int as nombre from voyageur where territoire_id = $1", [territoireId]);
  return rows[0].nombre;
}
