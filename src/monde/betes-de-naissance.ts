// Les Bêtes de naissance (US-0975) : à la naissance d'un Foyer, quelques Bêtes sauvages communes se posent sur des Cases
// libres à portée d'exploration de départ, une par Case, pour que le nouveau chef ramène ses premières Bêtes dès ses
// premières Expéditions. Elles lui sont réservées : les Expéditions des autres ne les rencontrent pas. Contrairement aux
// apparitions ordinaires, qui se recalculent à la demande (src/monde/betes-sauvages.ts), elles sont écrites en base
// (table bete_de_naissance), pour que l'étape 40 les fasse rencontrer. Comme toute Bête sauvage, elles ne se voient pas
// sur la carte. Côté serveur uniquement : l'heure du jeu vient de l'appelant.
import type { Pool, PoolClient } from "pg";
import { BETES_DE_NAISSANCE, PORTEE_D_EXPLORATION_CASES, PRESENCE_D_UNE_BETE_DE_NAISSANCE_HEURES } from "@/reglages";
import { casesDesAnneaux } from "./hex";

/** La Rareté des Bêtes de naissance : la plus basse, celle des Espèces que toute Expédition, même sans escorte, peut ramener. */
const COMMUNE = "commune";

/** Une Case libre à portée du Foyer, telle que le tirage la voit : son identifiant et son Biome (« eau » pour toutes ses variantes). */
export type CaseLibre = { id: number; biome: string };

/** US-0975 : une Bête de naissance tirée : sa Case et son Espèce. */
export type BeteTiree = { caseId: number; especeId: string };

/**
 * US-0975 : une Bête de naissance sur sa Case, de son arrivée jusqu'à son départ (exclu), PRESENCE_D_UNE_BETE_DE_NAISSANCE_HEURES
 * heures plus tard ; avec son Espèce et la Rareté de celle-ci, comme une Bête sauvage ordinaire (BeteSauvage).
 */
export type BeteDeNaissance = { id: number; arrivee: Date; depart: Date; especeId: string; rareteId: string };

/**
 * US-0975 : les Bêtes de naissance que le hasard `hasard` tire parmi les Cases libres à portée `cases` : `nombre` au plus,
 * une par Case, chacune sur une Case différente, toutes avec la même chance. US-0928 : l'Espèce de chacune se tire parmi
 * les communes qui vivent dans le Biome de sa Case (`communes`, rangées par Biome), chacune avec la même chance ; une Case
 * dont le Biome n'en compte aucune n'est pas choisie. Moins de Bêtes quand les Cases possibles manquent.
 */
export function tirerLesBetesDeNaissance(
  cases: readonly CaseLibre[],
  communes: ReadonlyMap<string, readonly string[]>,
  hasard: () => number,
  nombre: number = BETES_DE_NAISSANCE,
): BeteTiree[] {
  const possibles = cases.filter((c) => communes.get(c.biome)?.length);
  const tirees: BeteTiree[] = [];
  // Un tirage sans remise : chaque Case choisie passe en tête, hors du tirage suivant.
  for (let i = 0; i < Math.min(nombre, possibles.length); i++) {
    const j = i + Math.floor(hasard() * (possibles.length - i));
    [possibles[i], possibles[j]] = [possibles[j], possibles[i]];
    const especes = communes.get(possibles[i].biome)!;
    tirees.push({ caseId: possibles[i].id, especeId: especes[Math.floor(hasard() * especes.length)] });
  }
  return tirees;
}

/**
 * La portée d'exploration de départ, en décalages depuis le Foyer : les Cases à 1 à PORTEE_D_EXPLORATION_CASES Cases de
 * lui, comptées par `distance`, comme la destination d'une Expédition (US-0908).
 */
const PORTEE = casesDesAnneaux(1, PORTEE_D_EXPLORATION_CASES);

/**
 * US-0975 : pose les Bêtes de naissance du Territoire autour de son Foyer, à l'instant du jeu `instant`, pour
 * PRESENCE_D_UNE_BETE_DE_NAISSANCE_HEURES heures : sur les Cases libres de son Monde à portée d'exploration de départ
 * (PORTEE), tirées par tirerLesBetesDeNaissance parmi les Espèces communes de la base. Le Territoire les a dès lors reçues
 * (betes_de_naissance_le). Deux allers-retours ; appelée avec le client d'une transaction, elle tient dedans. Rend le
 * nombre de Bêtes posées.
 */
export async function poserLesBetesDeNaissance(base: Pool | PoolClient, territoireId: number, instant: Date, hasard: () => number): Promise<number> {
  const { rows } = await base.query<{ cases: CaseLibre[]; communes: { id: string; biome: string }[] }>(
    `select
       coalesce((select json_agg(json_build_object('id', c.id, 'biome', c.biome_id) order by c.id)
         from territoire t join case_du_monde f on f.id = t.foyer_case_id
         join unnest($2::int[], $3::int[]) as v(dq, dr) on true
         join case_du_monde c on c.monde_id = f.monde_id and c.q = f.q + v.dq and c.r = f.r + v.dr
         where t.id = $1 and c.chef_id is null), '[]') as cases,
       coalesce((select json_agg(json_build_object('id', id, 'biome', biome_id) order by id) from espece where rarete_id = $4), '[]') as communes`,
    [territoireId, PORTEE.map((d) => d.q), PORTEE.map((d) => d.r), COMMUNE],
  );
  const communes = new Map<string, string[]>();
  for (const e of rows[0].communes) communes.set(e.biome, [...(communes.get(e.biome) ?? []), e.id]);
  const tirees = tirerLesBetesDeNaissance(rows[0].cases, communes, hasard);
  const depart = new Date(instant.getTime() + PRESENCE_D_UNE_BETE_DE_NAISSANCE_HEURES * 3_600_000);
  // « on conflict do nothing » : une Case n'en porte jamais deux pour le même Territoire.
  const { rows: posees } = await base.query<{ n: number }>(
    `with posees as (
       insert into bete_de_naissance (territoire_id, case_id, espece_id, arrivee, depart)
       select $1, b.case_id, b.espece_id, $4, $5 from unnest($2::int[], $3::text[]) as b(case_id, espece_id)
       on conflict do nothing returning 1
     ), recues as (
       update territoire set betes_de_naissance_le = $4 where id = $1
     )
     select count(*)::int as n from posees`,
    [territoireId, tirees.map((b) => b.caseId), tirees.map((b) => b.especeId), instant, depart],
  );
  return posees[0].n;
}

/**
 * US-0975 : un Territoire né avant cette story, ou dont le Foyer a changé de Monde depuis (une bascule, US-0414), reçoit
 * ses Bêtes de naissance au retour de son chef, à l'instant du jeu `instant`, une seule fois : deux pages ouvertes au même
 * moment n'en posent qu'un lot. Rend le nombre de Bêtes posées, 0 s'il les avait déjà reçues.
 */
export async function recevoirLesBetesDeNaissance(pool: Pool, territoireId: number, instant: Date, hasard: () => number = Math.random): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    // La ligne du Territoire, verrouillée jusqu'à la fin : une seconde demande attend, puis la trouve déjà servie.
    const { rowCount } = await client.query("update territoire set betes_de_naissance_le = $2 where id = $1 and betes_de_naissance_le is null", [
      territoireId,
      instant,
    ]);
    const posees = rowCount === 1 ? await poserLesBetesDeNaissance(client, territoireId, instant, hasard) : 0;
    await client.query("commit");
    return posees;
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * US-0975 : les Bêtes de naissance réservées au Territoire présentes à un moment de [de, a) sur les Cases `caseIds`, Case
 * par Case, dans l'ordre de leur arrivée, pour que l'étape 40 les fasse rencontrer à ses Expéditions, et à elles seules :
 * celles des autres Territoires n'y sont pas, et les Bêtes sauvages ordinaires (betesSauvagesDesCases) ne les comptent pas.
 */
export async function betesDeNaissanceDesCases(
  base: Pool | PoolClient,
  territoireId: number,
  caseIds: number[],
  de: Date,
  a: Date,
): Promise<Map<number, BeteDeNaissance[]>> {
  const { rows } = await base.query<BeteDeNaissance & { caseId: number }>(
    `select b.id, b.case_id as "caseId", b.arrivee, b.depart, b.espece_id as "especeId", e.rarete_id as "rareteId"
     from bete_de_naissance b join espece e on e.id = b.espece_id
     where b.territoire_id = $1 and b.case_id = any($2::int[]) and b.arrivee < $4 and b.depart > $3
     order by b.arrivee, b.id`,
    [territoireId, caseIds, de, a],
  );
  const parCase = new Map<number, BeteDeNaissance[]>(caseIds.map((id) => [id, []]));
  for (const { caseId, ...bete } of rows) parCase.get(caseId)!.push(bete);
  return parCase;
}

/** US-0975 : le nombre de Bêtes de naissance du Territoire présentes à l'instant du jeu `instant` autour de son Foyer, dans son Monde. */
export async function betesDeNaissancePresentes(base: Pool | PoolClient, territoireId: number, instant: Date): Promise<number> {
  const { rows } = await base.query<{ n: number }>(
    `select count(*)::int as n from bete_de_naissance b
     join territoire t on t.id = b.territoire_id join case_du_monde f on f.id = t.foyer_case_id
     join case_du_monde c on c.id = b.case_id and c.monde_id = f.monde_id
     where b.territoire_id = $1 and b.arrivee <= $2 and b.depart > $2`,
    [territoireId, instant],
  );
  return rows[0].n;
}
