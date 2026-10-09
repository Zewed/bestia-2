// Le récit de retour d'une Expédition (US-0917) : à son retour au Foyer (src/expeditions/retour.ts), un Récit du
// Territoire dit où elle est allée, combien de temps ont duré son aller, son séjour et son retour, combien de Cases elle
// a sorties du brouillard et si des Bêtes se sont montrées. Le détail des Rencontres, Bête par Bête, viendra avec US-0940.
// US-0920 : rappelée, il le dit, et quand. Côté serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import { type Coordonnees, distance } from "@/monde/hex";
import { ecrireUnRecit, type NouveauRecit } from "@/monde/recits";
import { formaterJourEtHeure, formaterMinutes } from "@/temps/affichage";
import { casesLeveesParLExpedition } from "./brouillard";
import { casesDuFoyer } from "./choix-de-destination";
import { demiTourDUneExpedition, type HorairesDUneExpedition, sejourDUneExpedition } from "./phase";
import { rencontresDUneExpedition } from "./rencontres";

const MINUTE_MS = 60_000;

/** US-0920 : le fuseau des heures dites dans les Récits, comme sur la page Récits, en attendant celui de chaque joueur. */
const FUSEAU = "Europe/Paris";

/** US-0917 : les durées réelles d'une Expédition rentrée, en minutes de jeu : son aller, son séjour sur sa Case et son retour. */
export type DureesReelles = { aller: number; sejour: number; retour: number };

/** US-0920 : le rappel d'une Expédition : l'instant du jeu où le joueur l'a rappelée, et pendant quelle phase, l'aller ou le séjour. */
export type RappelARaconter = { le: Date; pendant: "aller" | "sejour" };

/**
 * US-0917 : ce que raconte le retour d'une Expédition : sa destination, avec son Biome désormais connu (une eau par sa
 * variante, comme la fiche de la Case) et sa distance au Foyer, en Cases ; ses durées réelles ; le nombre de Cases qu'elle
 * a sorties du brouillard (US-0914) et celui des Bêtes qu'elle a vues (US-0932) ; l'instant du jeu où elle est rentrée.
 * US-0920 : son rappel, si le joueur l'a rappelée (absent ou null sinon) ; une destination jamais atteinte, encore sous
 * le brouillard, se dit « Case inconnue ».
 */
export type RetourARaconter = {
  destination: { biome: string; distance: number };
  durees: DureesReelles;
  casesLevees: number;
  rencontres: number;
  rentreeLe: Date;
  rappel?: RappelARaconter | null;
};

/**
 * US-0917 : les durées réelles d'une Expédition rentrée à l'instant du jeu `rentreeLe` : l'aller jusqu'à son arrivée sur la
 * Case, son séjour, et son retour jusqu'à l'heure où elle est vraiment rentrée. Aucune tant que son trajet n'est pas
 * chiffré (US-0912). US-0920 : rappelée à l'aller, l'aller jusqu'au rappel, et aucun séjour ; en séjour, le séjour
 * jusqu'au rappel.
 */
export function dureesReelles(horaires: HorairesDUneExpedition, rentreeLe: Date): DureesReelles | null {
  const demiTour = demiTourDUneExpedition(horaires);
  if (!demiTour) return null;
  const sejour = sejourDUneExpedition(horaires);
  const minutes = (ms: number) => Math.round(ms / MINUTE_MS);
  return {
    aller: minutes(demiTour.allerMs),
    sejour: sejour ? minutes(sejour.fin.getTime() - sejour.debut.getTime()) : 0,
    retour: minutes(rentreeLe.getTime() - demiTour.le.getTime()),
  };
}

/**
 * US-0920 : le rappel d'une Expédition, s'il y en a eu un avant son demi-tour prévu : son instant, et la phase où il l'a
 * trouvée ; null sinon.
 */
function rappelDUneExpedition(horaires: HorairesDUneExpedition): RappelARaconter | null {
  const demiTour = demiTourDUneExpedition(horaires);
  if (!demiTour || !horaires.rappeleeLe || demiTour.le.getTime() !== horaires.rappeleeLe.getTime()) return null;
  return { le: horaires.rappeleeLe, pendant: sejourDUneExpedition(horaires) ? "sejour" : "aller" };
}

/** US-0920 : « Rappelée à l'aller le 9 octobre à 14:50. », « Rappelée pendant le séjour le 9 octobre à 15:30. ». */
function rappelee({ le, pendant }: RappelARaconter): string {
  return `Rappelée ${pendant === "aller" ? "à l'aller" : "pendant le séjour"} le ${formaterJourEtHeure(le, FUSEAU)}.`;
}

/** US-0917 : « 12 Cases sont sorties du brouillard. », « Une Case est sortie… », « Aucune Case n'est sortie… ». */
function casesSorties(nombre: number): string {
  if (nombre === 0) return "Aucune Case n'est sortie du brouillard.";
  return nombre === 1 ? "Une Case est sortie du brouillard." : `${nombre} Cases sont sorties du brouillard.`;
}

/** US-0917 : quand rien ne s'est passé, « Aucune Bête ne s'est montrée. » ; sinon « Une Bête s'est montrée. », « 3 Bêtes se sont montrées. ». */
function betesMontrees(nombre: number): string {
  if (nombre === 0) return "Aucune Bête ne s'est montrée.";
  return nombre === 1 ? "Une Bête s'est montrée." : `${nombre} Bêtes se sont montrées.`;
}

/**
 * US-0917 : le Récit du retour d'une Expédition, daté de l'instant où elle est rentrée : « Retour d'Expédition », puis une
 * ligne par fait : sa destination et son Biome, ses durées, les Cases sorties du brouillard, et les Bêtes qui se sont
 * montrées, ou la phrase qui dit qu'aucune ne l'a fait : il n'est jamais vide. US-0920 : rappelée, une ligne le dit, et
 * quand, avant ses durées ; sans séjour, « sans séjour ».
 */
export function recitDeRetour({ destination, durees, casesLevees, rencontres, rentreeLe, rappel }: RetourARaconter): NouveauRecit {
  const sejour = durees.sejour === 0 ? "sans séjour" : `séjour ${formaterMinutes(durees.sejour)}`;
  return {
    titre: "Retour d'Expédition",
    texte: [
      `Destination : ${destination.biome}, à ${casesDuFoyer(destination.distance)}.`,
      ...(rappel ? [rappelee(rappel)] : []),
      `Aller ${formaterMinutes(durees.aller)}, ${sejour}, retour ${formaterMinutes(durees.retour)}.`,
      casesSorties(casesLevees),
      // US-0940 : le détail de chaque Rencontre, Bête par Bête.
      betesMontrees(rencontres),
    ].join("\n"),
    survenuLe: rentreeLe,
  };
}

/**
 * US-0917 : écrit le Récit du retour de l'Expédition `expeditionId` du Territoire, rentrée à l'instant du jeu `rentreeLe`.
 * Appelée par rentrerAuFoyer, dans la transaction du temps qui avance : le Territoire est calculé jusqu'au retour, ses
 * Cases levées et ses Rencontres sont donc toutes retenues, les mêmes en direct qu'au rattrapage d'une absence.
 */
export async function raconterLeRetour(client: PoolClient, territoireId: number, expeditionId: number, rentreeLe: Date): Promise<void> {
  const { rows } = await client.query<HorairesDUneExpedition & { biome: string; decouverte: boolean; destination: Coordonnees; foyer: Coordonnees }>(
    `select coalesce(v.nom, b.nom) as biome, json_build_object('q', c.q, 'r', c.r) as destination, json_build_object('q', f.q, 'r', f.r) as foyer,
       exists (select 1 from case_decouverte d where d.territoire_id = x.territoire_id and d.case_id = c.id) as decouverte,
       x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes", x.rappelee_le as "rappeleeLe"
     from expedition x join case_du_monde c on c.id = x.case_id join biome b on b.id = c.biome_id
       left join variante_biome v on v.id = c.variante_id
       join territoire t on t.id = x.territoire_id join case_du_monde f on f.id = t.foyer_case_id
     where x.id = $2 and x.territoire_id = $1`,
    [territoireId, expeditionId],
  );
  // Après la bascule d'un Monde (US-0414), une Expédition déjà partie garde sa destination dans l'ancien : sa distance au
  // nouveau Foyer n'y a pas de sens, comme son chemin (leverLeBrouillard) ; cas rare, accepté.
  const { biome, decouverte, destination, foyer, ...horaires } = rows[0];
  // Un retour n'est programmé qu'au trajet chiffré (programmerLeRetour, migration 0052) : jamais atteint.
  const durees = dureesReelles(horaires, rentreeLe);
  if (!durees) throw new Error(`Retour sans trajet chiffré pour l'Expédition ${expeditionId}.`);
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  const casesLevees = await casesLeveesParLExpedition(client, expeditionId);
  const rencontres = (await rencontresDUneExpedition(client, expeditionId)).length;
  await ecrireUnRecit(
    client,
    territoireId,
    recitDeRetour({
      // US-0920 : rappelée avant de l'atteindre, sa destination reste sous le brouillard : son Biome ne se dit pas (US-0438).
      destination: { biome: decouverte ? biome : "Case inconnue", distance: distance(destination, foyer) },
      durees,
      casesLevees,
      rencontres,
      rentreeLe,
      rappel: rappelDUneExpedition(horaires),
    }),
  );
}
