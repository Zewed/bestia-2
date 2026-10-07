// Les données de référence telles qu'elles sont en base (pas dans les fichiers de donnees/),
// pour la page de contrôle.
import "server-only";
import type { Pool, PoolClient } from "pg";

export type BiomeEnBase = {
  id: string;
  nom: string;
  variantes: { id: string; nom: string }[];
  /** US-0209 : ce qu'une Case du Biome produit par heure, Ressource par Ressource, dans leur ordre. */
  production: { ressource: string; parHeure: string }[];
};

/** Les Biomes dans leur ordre, chacun avec ses variantes (les formes de l'eau) et sa production horaire. */
export async function biomesEnBase(base: Pool | PoolClient): Promise<BiomeEnBase[]> {
  const { rows } = await base.query<BiomeEnBase>(
    `select b.id, b.nom,
       coalesce((select json_agg(json_build_object('id', v.id, 'nom', v.nom) order by v.ordre) from variante_biome v where v.biome_id = b.id), '[]') as variantes,
       coalesce((select json_agg(json_build_object('ressource', r.nom, 'parHeure', p.par_heure::text) order by r.ordre)
                 from production_biome p join ressource r on r.id = p.ressource_id where p.biome_id = b.id), '[]') as production
     from biome b
     order by b.ordre`,
  );
  return rows;
}

export type RareteEnBase = { id: string; nom: string; rang: number; selevent: boolean };

/** Les Raretés, de la plus banale à la plus rare. */
export async function raretesEnBase(base: Pool | PoolClient): Promise<RareteEnBase[]> {
  const { rows } = await base.query<RareteEnBase>(`select id, nom, rang, s_elevent as selevent from rarete order by rang`);
  return rows;
}

export type RoleEnBase = { id: string; nom: string; phrase: string };

/** Les Rôles, dans leur ordre. */
export async function rolesEnBase(base: Pool | PoolClient): Promise<RoleEnBase[]> {
  const { rows } = await base.query<RoleEnBase>(`select id, nom, phrase from role order by ordre`);
  return rows;
}

export type EspeceEnBase = {
  id: string;
  nom: string;
  attaque: number;
  vie: number;
  vitesse: number;
  charge: number;
  /** Les Places qu'une Bête occupe. */
  taille: number;
  regime: string;
  entretienParHeure: number;
  biome: { id: string; nom: string };
  rarete: { id: string; nom: string };
  role: { id: string; nom: string } | null;
  masseG: number | null;
  facteurArme: number | null;
  illustration: string | null;
  source: string | null;
};

/** Les Espèces avec le nom de leur Biome, de leur Rareté et de leur Rôle, de la plus banale à la plus rare. */
export async function especesEnBase(base: Pool | PoolClient): Promise<EspeceEnBase[]> {
  const { rows } = await base.query<EspeceEnBase>(
    `select e.id, e.nom, e.attaque, e.vie, e.vitesse, e.charge, e.taille, e.regime,
       e.entretien_par_heure as "entretienParHeure",
       json_build_object('id', b.id, 'nom', b.nom) as biome,
       json_build_object('id', r.id, 'nom', r.nom) as rarete,
       case when ro.id is null then null else json_build_object('id', ro.id, 'nom', ro.nom) end as role,
       e.masse_g as "masseG", e.facteur_arme as "facteurArme", e.illustration, e.source
     from espece e
     join biome b on b.id = e.biome_id
     join rarete r on r.id = e.rarete_id
     left join role ro on ro.id = e.role_id
     order by r.rang, e.nom`,
  );
  return rows;
}
