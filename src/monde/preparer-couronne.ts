// Préparer la Couronne du Monde du jeu en base (US-0151). Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { MONDE_DU_JEU } from "./bascule";
import { casesDeLaCouronne, graineDuMonde } from "./couronne";
import { dansLeCoeur, eloignementDuCoeur } from "./hex";

/**
 * Crée les Cases de la Couronne du Monde qui n'existent pas encore, dans la transaction de
 * l'appelant. La première fois, la taille du Monde est fixée sur sa fiche et son rayon ne change
 * plus, ni celui de son Cœur sauvage (US-0403), dont chaque Case porte sa distance (US-0405) ; la
 * Couronne peut s'élargir vers l'intérieur si les réglages le demandent, jamais rétrécir. Une Case
 * déjà en base n'est jamais touchée. Rend le nombre de Cases ajoutées et leur total.
 */
export async function preparerCouronne(client: PoolClient, mondeId: number): Promise<{ ajoutees: number; total: number }> {
  // « for no key update » et non « for update » : il suffit pour passer une préparation à la fois, et
  // laisse naître les chefs pendant ce temps (leur fiche renvoie au Monde, ce qu'un « for update »
  // bloquerait, alors que la préparation attend la Case que la naissance est en train de prendre).
  const { rows } = await client.query<{ nom: string; rayon: number | null; anneaux: number | null; rayonCoeur: number | null; graine: string | null }>(
    `select nom, rayon, anneaux_couronne as anneaux, rayon_coeur as "rayonCoeur", graine from monde where id = $1 for no key update`,
    [mondeId],
  );
  if (!rows[0]) throw new Error(`Monde ${mondeId} introuvable.`);
  let { rayon, anneaux, rayonCoeur } = rows[0];
  // US-0401 : la Couronne est tirée de la graine enregistrée avec le Monde. Un Monde né sans graine
  // reçoit celle dont sa Couronne a toujours été tirée, celle de son nom : aucune Case ne change.
  const graine = rows[0].graine === null ? graineDuMonde(rows[0].nom) : Number(rows[0].graine);
  if (rayon === null || anneaux === null || anneaux < COURONNE_ANNEAUX || rayonCoeur === null || rows[0].graine === null) {
    rayon ??= MONDE_RAYON;
    anneaux = Math.max(anneaux ?? 0, COURONNE_ANNEAUX);
    rayonCoeur ??= COEUR_SAUVAGE_RAYON;
    await client.query("update monde set rayon = $2, anneaux_couronne = $3, rayon_coeur = $4, graine = $5 where id = $1", [mondeId, rayon, anneaux, rayonCoeur, graine]);
  }
  const cases = casesDeLaCouronne({ rayon, anneaux, graine });
  const { rowCount } = await client.query(
    `insert into case_du_monde (monde_id, q, r, anneau, couronne, coeur, eloignement, biome_id, variante_id)
     select $1, c.q, c.r, c.anneau, true, c.coeur, c.eloignement, c.biome, c.variante
     from unnest($2::int[], $3::int[], $4::int[], $5::boolean[], $6::int[], $7::text[], $8::text[]) as c(q, r, anneau, coeur, eloignement, biome, variante)
     on conflict (monde_id, q, r) do nothing`,
    [
      mondeId,
      cases.map((c) => c.q),
      cases.map((c) => c.r),
      cases.map((c) => c.anneau),
      cases.map((c) => dansLeCoeur(c, rayonCoeur)),
      cases.map((c) => eloignementDuCoeur(c, rayonCoeur)),
      cases.map((c) => c.biome),
      cases.map((c) => c.variante),
    ],
  );
  return { ajoutees: rowCount ?? 0, total: cases.length };
}

/**
 * US-0414 : à chaque mise en ligne (npm run monde:couronne), prépare la Couronne du Monde du jeu s'il n'a qu'elle,
 * comme Aube. Un Monde généré naît avec toutes ses Cases (creerUnMonde) : il en a hors de sa Couronne, et rien ne
 * lui manque. Rend le nom du Monde, et ce qu'a fait preparerCouronne, ou null pour un Monde généré.
 */
export async function preparerLaCouronneDuJeu(client: PoolClient): Promise<{ monde: string; preparee: { ajoutees: number; total: number } | null }> {
  const { rows } = await client.query<{ id: number; nom: string; genere: boolean }>(
    `select m.id, m.nom, exists (select 1 from case_du_monde c where c.monde_id = m.id and not c.couronne) as genere from monde m where m.id = ${MONDE_DU_JEU}`,
  );
  if (!rows[0]) throw new Error("Aucun Monde ouvert en base : lancez d'abord npm run db:migrate.");
  return { monde: rows[0].nom, preparee: rows[0].genere ? null : await preparerCouronne(client, rows[0].id) };
}
