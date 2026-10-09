// Les Récits d'un Territoire (US-0324) : ce qui lui est arrivé, que le joueur lit après coup. Côté
// serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import type { Sexe } from "./betes-sauvages";

/**
 * Un Récit tel que la page Récits le montre : luLe est null tant que le joueur ne l'a pas ouvert. US-0940 : le retour
 * d'une Expédition qui a vu des Bêtes a ses Rencontres, dans l'ordre des apparitions ; les autres Récits n'en ont pas.
 */
export type Recit = { id: number; titre: string; texte: string; survenuLe: Date; luLe: Date | null; rencontres?: RencontreDuRecit[] };

/**
 * US-0940 : ce qu'il advint d'une Bête vue lors d'une Rencontre : elle a suivi l'Expédition (apprivoisée) ; trop forte
 * pour son escorte, elle est restée sur sa Case ; ou elle en est repartie avant l'Expédition, à la fin de sa durée.
 */
export type IssueDUneRencontre = "apprivoisee" | "restee" | "repartie";

/**
 * US-0940 : une Rencontre telle que le Récit d'un retour d'Expédition la retient : l'Espèce de la Bête, l'instant du jeu
 * où l'Expédition l'a vue, ce qu'il en advint, son sexe si elle l'a suivie (null sinon, US-0937), et si elle a fait
 * entrer son Espèce au Bestiaire (US-0933). Restée sur sa Case, la force qui manquait à l'escorte (US-0942).
 */
export type RencontreRacontee = { especeId: string; vueLe: Date; issue: IssueDUneRencontre; sexe: Sexe | null; nouvelleEspece: boolean; manque?: number };

/** US-0940 : une Rencontre racontée telle que la page Récits la montre : avec le nom, l'illustration et la Rareté de son Espèce. */
export type RencontreDuRecit = RencontreRacontee & { nom: string; illustration: string | null; rarete: { id: string; nom: string } };

/** Ce qu'un événement raconte : un titre, le texte, et l'heure du jeu où il est survenu. */
export type NouveauRecit = { titre: string; texte: string; survenuLe: Date };

/**
 * Écrit un Récit pour un Territoire, non lu, et rend son identifiant. Pour les événements qui en
 * produisent (Famine, retours de Récolte ou d'Expédition, Attaques, Incursions) : appelée avec leur
 * client, elle tient dans leur transaction. US-0940 : le retour d'une Expédition y joint ses
 * Rencontres, Bête par Bête (`rencontres`) ; sans aucune, le Récit n'a que son texte.
 */
export async function ecrireUnRecit(client: Pool | PoolClient, territoireId: number, recit: NouveauRecit, rencontres?: readonly RencontreRacontee[]): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    "insert into recit (territoire_id, titre, texte, survenu_le, rencontres) values ($1, $2, $3, $4, $5::jsonb) returning id",
    [territoireId, recit.titre, recit.texte, recit.survenuLe, rencontres?.length ? JSON.stringify(rencontres) : null],
  );
  return rows[0].id;
}

/**
 * Les Récits d'un Territoire, du plus récent au plus ancien ; deux Récits de la même heure, le dernier écrit d'abord.
 * US-0940 : les Rencontres d'un retour d'Expédition, dans l'ordre où il les a retenues, chacune avec le nom,
 * l'illustration et la Rareté de son Espèce, lus comme sur sa fiche.
 */
export async function recitsDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Recit[]> {
  const { rows } = await base.query<Omit<Recit, "rencontres"> & { rencontres: (Omit<RencontreDuRecit, "vueLe"> & { vueLe: string })[] | null }>(
    `select r.id, r.titre, r.texte, r.survenu_le as "survenuLe", r.lu_le as "luLe",
       (select jsonb_agg(v.rencontre || jsonb_build_object('nom', e.nom, 'illustration', e.illustration, 'rarete', jsonb_build_object('id', ra.id, 'nom', ra.nom))
                         order by v.rang)
        from jsonb_array_elements(r.rencontres) with ordinality as v(rencontre, rang)
          join espece e on e.id = v.rencontre->>'especeId' join rarete ra on ra.id = e.rarete_id) as rencontres
     from recit r where r.territoire_id = $1
     order by r.survenu_le desc, r.id desc`,
    [territoireId],
  );
  return rows.map(({ rencontres, ...recit }) => (rencontres ? { ...recit, rencontres: rencontres.map((x) => ({ ...x, vueLe: new Date(x.vueLe) })) } : recit));
}

/** Le nombre de Récits que le joueur n'a pas encore ouverts, pour l'entrée « Récits » de la navigation. */
export async function nombreDeRecitsNonLus(base: Pool | PoolClient, territoireId: number): Promise<number> {
  const { rows } = await base.query<{ nombre: number }>("select count(*)::int as nombre from recit where territoire_id = $1 and lu_le is null", [
    territoireId,
  ]);
  return rows[0].nombre;
}

/**
 * Note qu'un Récit a été ouvert, une seule fois, et seulement s'il appartient bien au Territoire : rend
 * true s'il vient d'être marqué lu, false s'il l'était déjà ou n'est pas à ce Territoire.
 */
export async function marquerUnRecitLu(base: Pool | PoolClient, territoireId: number, recitId: number, instant: Date): Promise<boolean> {
  const { rowCount } = await base.query("update recit set lu_le = $3 where id = $2 and territoire_id = $1 and lu_le is null", [
    territoireId,
    recitId,
    instant,
  ]);
  return rowCount === 1;
}
