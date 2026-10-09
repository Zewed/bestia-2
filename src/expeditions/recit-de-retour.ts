// Le récit de retour d'une Expédition (US-0917) : à son retour au Foyer (src/expeditions/retour.ts), un Récit du
// Territoire dit où elle est allée, combien de temps ont duré son aller, son séjour et son retour, combien de Cases elle
// a sorties du brouillard et si des Bêtes se sont montrées. Le détail des Rencontres, Bête par Bête, viendra avec US-0940.
// US-0938 : et les Bêtes qui l'ont suivie jusqu'au Foyer. Côté serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import type { Sexe } from "@/monde/betes-sauvages";
import { type Coordonnees, distance } from "@/monde/hex";
import { ecrireUnRecit, type NouveauRecit } from "@/monde/recits";
import { formaterMinutes } from "@/temps/affichage";
import { casesLeveesParLExpedition } from "./brouillard";
import { casesDuFoyer } from "./choix-de-destination";
import { type HorairesDUneExpedition, sejourDUneExpedition } from "./phase";
import { rencontresDUneExpedition } from "./rencontres";
import { betesQuiSuivent } from "./sexe";

const MINUTE_MS = 60_000;

/** US-0917 : les durées réelles d'une Expédition rentrée, en minutes de jeu : son aller, son séjour sur sa Case et son retour. */
export type DureesReelles = { aller: number; sejour: number; retour: number };

/**
 * US-0917 : ce que raconte le retour d'une Expédition : sa destination, avec son Biome désormais connu (une eau par sa
 * variante, comme la fiche de la Case) et sa distance au Foyer, en Cases ; ses durées réelles ; le nombre de Cases qu'elle
 * a sorties du brouillard (US-0914) et celui des Bêtes qu'elle a vues (US-0932) ; l'instant du jeu où elle est rentrée.
 */
export type RetourARaconter = {
  destination: { biome: string; distance: number };
  durees: DureesReelles;
  casesLevees: number;
  rencontres: number;
  rentreeLe: Date;
  /** US-0938 : les Bêtes qui l'ont suivie jusqu'au Foyer, dans l'ordre de leur Apprivoisement ; absentes : aucune. */
  ramenees?: BeteRamenee[];
};

/** US-0938 : une Bête qui a suivi l'Expédition jusqu'au Foyer : le nom de son Espèce et son sexe. */
export type BeteRamenee = { nom: string; sexe: Sexe };

/**
 * US-0917 : les durées réelles d'une Expédition rentrée à l'instant du jeu `rentreeLe` : l'aller jusqu'à son arrivée sur la
 * Case, son séjour, et son retour jusqu'à l'heure où elle est vraiment rentrée. Aucune tant que son trajet n'est pas
 * chiffré (US-0912).
 */
export function dureesReelles(horaires: HorairesDUneExpedition, rentreeLe: Date): DureesReelles | null {
  const sejour = sejourDUneExpedition(horaires);
  if (!sejour) return null;
  const minutes = (de: Date, a: Date) => Math.round((a.getTime() - de.getTime()) / MINUTE_MS);
  return { aller: minutes(horaires.partLe, sejour.debut), sejour: minutes(sejour.debut, sejour.fin), retour: minutes(sejour.fin, rentreeLe) };
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

/** US-0938 : « 2 mâles », « 1 femelle » ; une Bête seule, son sexe : « mâle ». */
function sexes({ male, femelle }: Record<Sexe, number>): string {
  if (male + femelle === 1) return male ? "mâle" : "femelle";
  const dits = [male > 0 && `${male} ${male > 1 ? "mâles" : "mâle"}`, femelle > 0 && `${femelle} ${femelle > 1 ? "femelles" : "femelle"}`];
  return dits.filter(Boolean).join(", ");
}

/**
 * US-0938 : « Bête ramenée au Foyer : Renard roux (mâle). », « Bêtes ramenées au Foyer : Souris grise (2 mâles, 1 femelle)
 * et Poule (femelle). » : chaque Espèce une fois, dans l'ordre de son premier Apprivoisement, avec ses mâles et ses femelles.
 */
function betesRamenees(betes: readonly BeteRamenee[]): string {
  const parEspece = new Map<string, Record<Sexe, number>>();
  for (const { nom, sexe } of betes) {
    const compte = parEspece.get(nom) ?? { male: 0, femelle: 0 };
    compte[sexe]++;
    parEspece.set(nom, compte);
  }
  const especes = [...parEspece].map(([nom, compte]) => `${nom} (${sexes(compte)})`);
  const liste = especes.length > 1 ? `${especes.slice(0, -1).join(", ")} et ${especes.at(-1)}` : especes[0];
  return `${betes.length > 1 ? "Bêtes ramenées" : "Bête ramenée"} au Foyer : ${liste}.`;
}

/**
 * US-0917 : le Récit du retour d'une Expédition, daté de l'instant où elle est rentrée : « Retour d'Expédition », puis une
 * ligne par fait : sa destination et son Biome, ses durées, les Cases sorties du brouillard, et les Bêtes qui se sont
 * montrées, ou la phrase qui dit qu'aucune ne l'a fait : il n'est jamais vide. US-0938 : puis, si des Bêtes ont suivi
 * l'Expédition, une ligne les dit arrivées au Foyer.
 */
export function recitDeRetour({ destination, durees, casesLevees, rencontres, rentreeLe, ramenees }: RetourARaconter): NouveauRecit {
  return {
    titre: "Retour d'Expédition",
    texte: [
      `Destination : ${destination.biome}, à ${casesDuFoyer(destination.distance)}.`,
      // US-0920 : une Expédition rappelée le dira ici, avec le moment de son rappel.
      `Aller ${formaterMinutes(durees.aller)}, séjour ${formaterMinutes(durees.sejour)}, retour ${formaterMinutes(durees.retour)}.`,
      casesSorties(casesLevees),
      // US-0940 : le détail de chaque Rencontre, Bête par Bête.
      betesMontrees(rencontres),
      ...(ramenees?.length ? [betesRamenees(ramenees)] : []),
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
  const { rows } = await client.query<HorairesDUneExpedition & { biome: string; destination: Coordonnees; foyer: Coordonnees }>(
    `select coalesce(v.nom, b.nom) as biome, json_build_object('q', c.q, 'r', c.r) as destination, json_build_object('q', f.q, 'r', f.r) as foyer,
       x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x join case_du_monde c on c.id = x.case_id join biome b on b.id = c.biome_id
       left join variante_biome v on v.id = c.variante_id
       join territoire t on t.id = x.territoire_id join case_du_monde f on f.id = t.foyer_case_id
     where x.id = $2 and x.territoire_id = $1`,
    [territoireId, expeditionId],
  );
  // Après la bascule d'un Monde (US-0414), une Expédition déjà partie garde sa destination dans l'ancien : sa distance au
  // nouveau Foyer n'y a pas de sens, comme son chemin (leverLeBrouillard) ; cas rare, accepté.
  const { biome, destination, foyer, ...horaires } = rows[0];
  // Un retour n'est programmé qu'au trajet chiffré (programmerLeRetour, migration 0052) : jamais atteint.
  const durees = dureesReelles(horaires, rentreeLe);
  if (!durees) throw new Error(`Retour sans trajet chiffré pour l'Expédition ${expeditionId}.`);
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  const casesLevees = await casesLeveesParLExpedition(client, expeditionId);
  const rencontres = (await rencontresDUneExpedition(client, expeditionId)).length;
  const ramenees = await betesRameneesAuFoyer(client, expeditionId);
  await ecrireUnRecit(
    client,
    territoireId,
    recitDeRetour({ destination: { biome, distance: distance(destination, foyer) }, durees, casesLevees, rencontres, rentreeLe, ramenees }),
  );
}

/** US-0938 : les Bêtes qui ont suivi l'Expédition jusqu'au Foyer (betesQuiSuivent), avec le nom de leur Espèce. */
async function betesRameneesAuFoyer(client: PoolClient, expeditionId: number): Promise<BeteRamenee[]> {
  const betes = await betesQuiSuivent(client, expeditionId);
  if (betes.length === 0) return [];
  const { rows } = await client.query<{ id: string; nom: string }>("select id, nom from espece where id = any($1::text[])", [[...new Set(betes.map((b) => b.especeId))]]);
  const noms = new Map(rows.map((e) => [e.id, e.nom]));
  return betes.map((b) => ({ nom: noms.get(b.especeId)!, sexe: b.sexe }));
}
