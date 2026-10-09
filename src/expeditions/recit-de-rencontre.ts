// Le récit de Rencontre (US-0940) : le Récit du retour d'une Expédition (src/expeditions/recit-de-retour.ts) retient, sous
// son texte, chaque Bête qu'elle a vue sur sa Case (US-0932), à l'heure où elle l'a vue, et ce qu'il en advint :
// apprivoisée, avec son sexe (US-0934, US-0937) ; trop forte pour son escorte, restée sur sa Case (US-0942) ; ou repartie
// à la fin de sa durée (US-0926), avant que l'Expédition ne quitte la Case. Une Bête vue qui n'a pas suivi l'Expédition
// était trop forte pour son escorte : à portée, elle aurait suivi la première Expédition qui la voyait (lExpeditionSuivie).
// La page Récits les montre avec l'illustration et la Rareté de leur Espèce. Côté serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import { betesDeNaissanceDesCases } from "@/monde/betes-de-naissance";
import { betesSauvagesDesCases, type Sexe } from "@/monde/betes-sauvages";
import type { IssueDUneRencontre, RencontreRacontee } from "@/monde/recits";
import type { Rencontre } from "./rencontres";

/**
 * US-0940 : ce qu'il advint de la Bête d'une Rencontre : apprivoisée, elle a suivi l'Expédition ; sinon, trop forte pour son
 * escorte, elle est repartie si elle a quitté sa Case (`depart`) avant la fin du séjour de l'Expédition (`finDuSejour`),
 * et restée sur sa Case si elle y était encore jusqu'au bout. Sans départ connu (null), elle est restée.
 */
export function issueDUneRencontre(apprivoisee: boolean, depart: Date | null, finDuSejour: Date): IssueDUneRencontre {
  if (apprivoisee) return "apprivoisee";
  return depart !== null && depart < finDuSejour ? "repartie" : "restee";
}

/**
 * US-0940 : les Rencontres `vues` de l'Expédition `expeditionId` du Territoire (rencontresDUneExpedition), telles que son
 * Récit les retient, dans le même ordre, celui des apparitions : son séjour sur sa Case, `sejour`, dit si chaque Bête qui
 * ne l'a pas suivie en est repartie avant elle. Aucune sans séjour. Appelée au retour, dans sa transaction : le Territoire
 * est calculé jusque-là, ses Rencontres et les départs des Bêtes sont tous retenus.
 */
export async function rencontresARaconter(
  client: PoolClient,
  territoireId: number,
  expeditionId: number,
  vues: readonly Rencontre[],
  sejour: { debut: Date; fin: Date } | null,
): Promise<RencontreRacontee[]> {
  if (vues.length === 0 || !sejour) return [];
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  const sexes = await sexesDesApprivoisees(client, expeditionId);
  const departs = await departsDesBetesRestees(client, territoireId, vues, sejour);
  return vues.map((r) => ({
    especeId: r.especeId,
    vueLe: r.vueLe,
    issue: issueDUneRencontre(r.apprivoisee, departs.get(r.id) ?? null, sejour.fin),
    sexe: sexes.get(r.id) ?? null,
    nouvelleEspece: r.nouvelleEspece,
  }));
}

/** US-0937 : le sexe de chaque Bête apprivoisée lors d'une Rencontre de l'Expédition `expeditionId`, par Rencontre. */
async function sexesDesApprivoisees(client: PoolClient, expeditionId: number): Promise<Map<number, Sexe>> {
  const { rows } = await client.query<{ id: number; sexe: Sexe }>("select id, sexe from rencontre where expedition_id = $1 and apprivoisee", [expeditionId]);
  return new Map(rows.map((r) => [r.id, r.sexe]));
}

/**
 * US-0926 : l'instant où chaque Bête des Rencontres `vues` qui n'a pas suivi l'Expédition a quitté sa Case, par Rencontre :
 * à la fin de sa durée, ou plus tôt si elle a suivi une autre Expédition, lu comme les Rencontres le lisent, parmi les Bêtes
 * de la Case pendant le séjour `sejour` (betesSauvagesDesCases, betesDeNaissanceDesCases) ; aucune lecture si toutes l'ont
 * suivie.
 */
async function departsDesBetesRestees(
  client: PoolClient,
  territoireId: number,
  vues: readonly Rencontre[],
  sejour: { debut: Date; fin: Date },
): Promise<Map<number, Date>> {
  const restees = vues.filter((r) => !r.apprivoisee);
  const departs = new Map<number, Date>();
  if (restees.length === 0) return departs;
  const caseId = restees[0].caseId;
  if (restees.some((r) => r.numero !== null)) {
    const sauvages = new Map((await betesSauvagesDesCases(client, [caseId], sejour.debut, sejour.fin)).get(caseId)!.map((b) => [b.numero, b.depart]));
    for (const r of restees) if (r.numero !== null && sauvages.has(r.numero)) departs.set(r.id, sauvages.get(r.numero)!);
  }
  if (restees.some((r) => r.beteDeNaissanceId !== null)) {
    const deNaissance = new Map((await betesDeNaissanceDesCases(client, territoireId, [caseId], sejour.debut, sejour.fin)).get(caseId)!.map((b) => [b.id, b.depart]));
    for (const r of restees) if (r.beteDeNaissanceId !== null && deNaissance.has(r.beteDeNaissanceId)) departs.set(r.id, deNaissance.get(r.beteDeNaissanceId)!);
  }
  return departs;
}
