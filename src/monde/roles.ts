// Les Bêtes affectées à leur Rôle (US-0837) : comme on donne un Métier à un Habitant, le joueur affecte des Bêtes d'une
// Espèce dont le Rôle sert au Foyer, depuis la page Bêtes ; elles le remplissent aussitôt, sans Recherche ni Poste.
// Seules les Bêtes valides au Foyer le peuvent, ni sorties en escorte ni Blessées. Une Bête affectée reste dans
// l'effectif : elle mange et occupe ses Places comme les autres. Les Bêtes d'un Couple, parties en Réserve hors de
// l'effectif, ne le sont pas (décidé le 2026-10-13). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { GUERISON_DES_BLESSES_HEURES } from "@/reglages";
import { BETES_SORTIES } from "./effectif";

/**
 * US-0837 : les Rôles qui servent au Foyer, et s'affectent depuis la page Bêtes : le Nourricier. L'Éclaireur, lui,
 * s'affecte au départ d'une Expédition (US-0976) ; le Porteur et le Bâtisseur, aux Récoltes et aux constructions qui ne
 * sont pas encore là.
 */
export const ROLES_AU_FOYER: readonly string[] = ["nourricier"];

/**
 * US-0837 : le Rôle au Foyer d'une Espèce de l'effectif : le Rôle, combien de ses Bêtes y sont affectées, et combien
 * peuvent l'être, ses Bêtes valides au Foyer. Jamais plus d'affectées que de valides.
 */
export type RoleAuFoyer = { role: { id: string; nom: string }; affectees: number; valides: number };

/**
 * US-0837 : chaque Espèce de l'effectif du Territoire dont le Rôle sert au Foyer, ligne par ligne (`e`, regroupée par
 * Territoire et Espèce, et `nombre`, son effectif) : son Rôle, ses Bêtes valides au Foyer à l'instant du jeu $2, et ses
 * Bêtes affectées parmi elles. Valides : l'effectif, moins les Bêtes sorties en escorte (BETES_SORTIES), moins les Blessés
 * au Foyer pas encore guéris $3 heures après leur retour (la règle de blessesAuFoyer). Le nombre retenu (affectation)
 * peut les dépasser quand des affectées sortent ou se blessent : seules les valides se lisent affectées.
 */
const ROLES_DE_L_EFFECTIF = `
  select e.espece_id, ro.id as role_id, ro.nom as role_nom, v.valides, least(coalesce(a.nombre, 0), v.valides) as affectees
  from (select territoire_id, espece_id, sum(nombre)::int as nombre from effectif where territoire_id = $1 group by territoire_id, espece_id) e
  join espece es on es.id = e.espece_id
  join role ro on ro.id = es.role_id and ro.id = any($4::text[])
  cross join lateral (select greatest(0, e.nombre - (${BETES_SORTIES})) as au_foyer) f
  cross join lateral (
    select f.au_foyer - least(f.au_foyer, (
      select coalesce(sum(s.blessees), 0)::int from expedition_escorte s join expedition x on x.id = s.expedition_id
      where x.territoire_id = e.territoire_id and s.espece_id = e.espece_id and x.rentree_le is not null
        and x.rentree_le + $3 * interval '1 hour' > $2
    )) as valides
  ) v
  left join affectation a on a.territoire_id = e.territoire_id and a.espece_id = e.espece_id
  where e.nombre > 0`;

/**
 * US-0837 : les Espèces de l'effectif du Territoire dont le Rôle sert au Foyer, à l'instant du jeu `instant`, avec leur
 * Rôle, leurs Bêtes affectées et leurs Bêtes valides (RoleAuFoyer). Aucune autre Espèce.
 */
export async function rolesAuFoyer(base: Pool | PoolClient, territoireId: number, instant: Date): Promise<Map<string, RoleAuFoyer>> {
  const { rows } = await base.query<{ espece_id: string; role_id: string; role_nom: string; valides: number; affectees: number }>(
    `${ROLES_DE_L_EFFECTIF} order by e.espece_id`,
    [territoireId, instant, GUERISON_DES_BLESSES_HEURES, ROLES_AU_FOYER],
  );
  return new Map(rows.map((r) => [r.espece_id, { role: { id: r.role_id, nom: r.role_nom }, affectees: r.affectees, valides: r.valides }]));
}

/**
 * US-0837 : « + » : affecte une Bête de plus de l'Espèce `especeId` à son Rôle, gratuitement et aussitôt, à l'instant du
 * jeu `instant`, s'il lui reste une Bête valide au Foyer qui ne l'est pas ; rend false sinon, ou pour une Espèce dont le
 * Rôle ne sert pas au Foyer, ou absente de l'effectif. Le compte part des affectées lues (rolesAuFoyer), jamais plus que
 * les valides. D'une seule requête : des « + » envoyés au même instant attendent chacun le précédent, et aucun n'affecte
 * plus de Bêtes qu'il n'y en a de valides.
 */
export async function affecterUneBete(base: Pool | PoolClient, territoireId: number, especeId: string, instant: Date): Promise<boolean> {
  const { rowCount } = await base.query(
    `with v as (${ROLES_DE_L_EFFECTIF} and e.espece_id = $5)
     insert into affectation (territoire_id, espece_id, nombre)
     select $1, $5, 1 from v where v.valides > 0
     on conflict (territoire_id, espece_id) do update set nombre = least(affectation.nombre, (select valides from v)) + 1
       where least(affectation.nombre, (select valides from v)) < (select valides from v)`,
    [territoireId, instant, GUERISON_DES_BLESSES_HEURES, ROLES_AU_FOYER, especeId],
  );
  return rowCount === 1;
}

/**
 * US-0837 : « − » : retire de son Rôle une Bête de l'Espèce `especeId`, gratuitement et aussitôt, à l'instant du jeu
 * `instant`, s'il en reste une d'affectée ; rend false sinon. Comme « + », le compte part des affectées lues, et des
 * « − » envoyés au même instant n'en retirent jamais plus qu'il n'y en avait.
 */
export async function retirerUneBete(base: Pool | PoolClient, territoireId: number, especeId: string, instant: Date): Promise<boolean> {
  const { rowCount } = await base.query(
    `with v as (${ROLES_DE_L_EFFECTIF} and e.espece_id = $5)
     update affectation a set nombre = least(a.nombre, v.valides) - 1 from v
     where a.territoire_id = $1 and a.espece_id = $5 and least(a.nombre, v.valides) > 0`,
    [territoireId, instant, GUERISON_DES_BLESSES_HEURES, ROLES_AU_FOYER, especeId],
  );
  return rowCount === 1;
}
