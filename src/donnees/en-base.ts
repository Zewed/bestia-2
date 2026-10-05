// Les données de référence telles qu'elles sont en base (pas dans les fichiers de donnees/),
// pour la page de contrôle et les écrans du jeu.
import "server-only";
import type { Pool, PoolClient } from "pg";

export type BiomeEnBase = { id: string; nom: string; variantes: { id: string; nom: string }[] };

/** Les Biomes dans leur ordre, chacun avec ses variantes (les formes de l'eau). */
export async function biomesEnBase(base: Pool | PoolClient): Promise<BiomeEnBase[]> {
  const { rows } = await base.query<BiomeEnBase>(
    `select b.id, b.nom,
       coalesce(json_agg(json_build_object('id', v.id, 'nom', v.nom) order by v.ordre) filter (where v.id is not null), '[]') as variantes
     from biome b left join variante_biome v on v.biome_id = b.id
     group by b.id
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

export type CoupleDeDepartEnBase = {
  espece: { id: string; nom: string; illustration: string | null };
  rarete: { id: string; nom: string };
};

/** Les Couples de départ proposés au nouveau joueur (US-0141), dans leur ordre. */
export async function couplesDeDepartEnBase(base: Pool | PoolClient): Promise<CoupleDeDepartEnBase[]> {
  const { rows } = await base.query<CoupleDeDepartEnBase>(
    `select json_build_object('id', e.id, 'nom', e.nom, 'illustration', e.illustration) as espece,
       json_build_object('id', r.id, 'nom', r.nom) as rarete
     from couple_de_depart c
     join espece e on e.id = c.espece_id
     join rarete r on r.id = e.rarete_id
     order by c.ordre`,
  );
  return rows;
}

