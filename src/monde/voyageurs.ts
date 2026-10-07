// Les Voyageurs (US-0331) : des humains de passage qui se présentent de temps en temps aux portes d'un
// Territoire, et y attendent. Côté serveur uniquement.
import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { VOYAGEUR_TOUTES_LES_HEURES, VOYAGEURS_EN_ATTENTE_MAX } from "@/reglages";
import { programmerEvenement, type Evenement } from "@/temps/avancer";

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

/** US-0332 : un Voyageur qui attend aux portes : son prénom et l'heure du jeu de son arrivée. */
export type VoyageurAuxPortes = { id: number; prenom: string; arriveLe: Date };

/** US-0332 : les Voyageurs qui attendent aux portes du Territoire, du premier arrivé au dernier. */
export async function voyageursAuxPortes(base: Pool | PoolClient, territoireId: number): Promise<VoyageurAuxPortes[]> {
  const { rows } = await base.query<VoyageurAuxPortes>(
    `select id, prenom, arrive_le as "arriveLe" from voyageur where territoire_id = $1 order by arrive_le, id`,
    [territoireId],
  );
  return rows;
}

/** US-0332 : le nombre de Voyageurs qui attendent aux portes, pour le repère de l'entrée « Habitants ». */
export async function nombreDeVoyageurs(base: Pool | PoolClient, territoireId: number): Promise<number> {
  const { rows } = await base.query<{ nombre: number }>("select count(*)::int as nombre from voyageur where territoire_id = $1", [territoireId]);
  return rows[0].nombre;
}
