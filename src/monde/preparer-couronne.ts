// Préparer la Couronne du Monde du jeu en base (US-0151). Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { casesDeLaCouronne, graineDuMonde } from "./couronne";

/**
 * Crée les Cases de la Couronne du Monde qui n'existent pas encore, dans la transaction de
 * l'appelant. La première fois, la taille du Monde est fixée sur sa fiche et son rayon ne change
 * plus ; la Couronne peut s'élargir vers l'intérieur si les réglages le demandent, jamais
 * rétrécir. Une Case déjà en base n'est jamais touchée. Rend le nombre de Cases ajoutées et leur total.
 */
export async function preparerCouronne(client: PoolClient, mondeId: number): Promise<{ ajoutees: number; total: number }> {
  // « for no key update » et non « for update » : il suffit pour passer une préparation à la fois, et
  // laisse naître les chefs pendant ce temps (leur fiche renvoie au Monde, ce qu'un « for update »
  // bloquerait, alors que la préparation attend la Case que la naissance est en train de prendre).
  const { rows } = await client.query<{ nom: string; rayon: number | null; anneaux: number | null }>(
    "select nom, rayon, anneaux_couronne as anneaux from monde where id = $1 for no key update",
    [mondeId],
  );
  if (!rows[0]) throw new Error(`Monde ${mondeId} introuvable.`);
  let { rayon, anneaux } = rows[0];
  if (rayon === null || anneaux === null || anneaux < COURONNE_ANNEAUX) {
    rayon ??= MONDE_RAYON;
    anneaux = Math.max(anneaux ?? 0, COURONNE_ANNEAUX);
    await client.query("update monde set rayon = $2, anneaux_couronne = $3 where id = $1", [mondeId, rayon, anneaux]);
  }
  const cases = casesDeLaCouronne({ rayon, anneaux, graine: graineDuMonde(rows[0].nom) });
  const { rowCount } = await client.query(
    `insert into case_du_monde (monde_id, q, r, anneau, couronne, biome_id, variante_id)
     select $1, c.q, c.r, c.anneau, true, c.biome, c.variante
     from unnest($2::int[], $3::int[], $4::int[], $5::text[], $6::text[]) as c(q, r, anneau, biome, variante)
     on conflict (monde_id, q, r) do nothing`,
    [mondeId, cases.map((c) => c.q), cases.map((c) => c.r), cases.map((c) => c.anneau), cases.map((c) => c.biome), cases.map((c) => c.variante)],
  );
  return { ajoutees: rowCount ?? 0, total: cases.length };
}
