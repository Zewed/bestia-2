// Les données de référence telles qu'elles sont en base (pas dans les fichiers de donnees/),
// pour la page de contrôle.
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
