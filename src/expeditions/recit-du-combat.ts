// Le récit du combat (US-0947) : au retour d'une Expédition attaquée par une Bête trop forte (US-0943), son Récit dit
// chaque combat (US-0944) : son heure, l'Espèce de la Bête et sa force exacte, la force de l'escorte, et ses pertes,
// Espèce par Espèce (src/expeditions/recit-de-retour.ts). Le combat ne retient que ses pertes, en tout (`perdues` de
// l'escorte) : l'escorte de départ, les attaques retenues avec leurs Rencontres et la règle du combat (pertesDuCombat)
// suffisent à le rejouer, dans l'ordre où les combats se sont livrés (dansLOrdreDesCombats), chacun contre les
// survivantes du précédent, comme subirLesCombats. Le rejeu ne fait foi que s'il retrouve les pertes retenues : la règle
// ou les Espèces ont pu changer entre le combat et le retour, et le récit dit alors les pertes retenues, en tout. Côté
// serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import { type EspeceAuCombat, type Perte, pertesDuCombat } from "./combat";
import { forceDeLEscorte, forceDUneBete } from "./force";
import { dansLOrdreDesCombats } from "./pertes";

/** US-0947 : des Bêtes perdues d'une Espèce de l'escorte, avec le nom de l'Espèce. */
export type PerteNommee = Perte & { nom: string };

/**
 * US-0947 : un combat tel que le récit du retour le dit : la Rencontre de la Bête qui a attaqué, l'instant du combat, le
 * nom de l'Espèce de la Bête et sa force (US-0905), la force de l'escorte à cet instant, si elle n'avait plus aucune Bête
 * (`sansEscorte`), et ses pertes, Espèce par Espèce ; null quand le rejeu ne retrouve pas les pertes retenues.
 */
export type CombatARaconter = {
  rencontreId: number;
  le: Date;
  bete: { nom: string; force: number };
  escorte: number;
  sansEscorte: boolean;
  pertes: PerteNommee[] | null;
};

/** US-0947 : une attaque à rejouer : sa Rencontre, son instant, le nom de l'Espèce de la Bête et sa force. */
export type AttaqueARejouer = { rencontreId: number; le: Date; nom: string; force: number };

/**
 * US-0947 : les combats des attaques `attaques`, dans l'ordre reçu, celui où ils se sont livrés, contre l'escorte `escorte`
 * de l'Expédition au départ : chacun contre les survivantes des précédents, avec les pertes que le combat a prises
 * (pertesDuCombat). Une escorte perdue tout entière, ou absente, ne perd plus rien.
 */
export function combatsRejoues(escorte: readonly (EspeceAuCombat & { nom: string })[], attaques: readonly AttaqueARejouer[]): CombatARaconter[] {
  const restantes = new Map(escorte.map((e) => [e.especeId, { ...e }]));
  return attaques.map(({ rencontreId, le, nom, force }) => {
    const encore = [...restantes.values()].filter((e) => e.nombre > 0);
    // La force de l'escorte au combat, avant ses pertes.
    const escorteAuCombat = forceDeLEscorte(encore);
    const pertes = pertesDuCombat(force, encore).map((p) => ({ ...p, nom: restantes.get(p.especeId)!.nom }));
    for (const p of pertes) restantes.get(p.especeId)!.nombre -= p.nombre;
    return { rencontreId, le, bete: { nom, force }, escorte: escorteAuCombat, sansEscorte: encore.length === 0, pertes };
  });
}

/**
 * US-0947 : les combats d'une Expédition rejoués (combatsRejoues) contre son escorte `escorte` au départ, avec les Bêtes
 * que chacune de ses Espèces a perdues en tout (`perdues`, retenues au combat), et ces pertes retenues, Espèce par
 * Espèce, dans l'ordre des Espèces. Le rejeu qui ne les retrouve pas, Espèce par Espèce, ne répartit pas les pertes entre
 * les combats : chacun les a à null, et le récit dit les pertes retenues, en tout.
 */
export function combatsRetrouves(
  escorte: readonly (EspeceAuCombat & { nom: string; perdues: number })[],
  attaques: readonly AttaqueARejouer[],
): { combats: CombatARaconter[]; pertes: PerteNommee[] } {
  const combats = combatsRejoues(escorte, attaques);
  const pertes = escorte.filter((e) => e.perdues > 0).map(({ especeId, nom, perdues }) => ({ especeId, nom, nombre: perdues }));
  const rejouees = (especeId: string) => combats.reduce((n, c) => n + (c.pertes!.find((p) => p.especeId === especeId)?.nombre ?? 0), 0);
  const retrouvees = escorte.every((e) => rejouees(e.especeId) === e.perdues);
  return { combats: retrouvees ? combats : combats.map((c) => ({ ...c, pertes: null })), pertes };
}

/**
 * US-0947 : les combats qu'a livrés l'Expédition `expeditionId` (combatsRetrouves), dans l'ordre où ils se sont livrés,
 * depuis son escorte au départ, ses pertes retenues et ses attaques retenues (US-0943) ; aucun sans attaque. Lue au
 * retour, dans sa transaction : toutes ses attaques sont retenues, et leurs combats livrés.
 */
export async function combatsDUneExpedition(client: PoolClient, expeditionId: number): Promise<{ combats: CombatARaconter[]; pertes: PerteNommee[] }> {
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  const { rows: attaques } = await client.query<{ rencontreId: number; le: Date; numero: string | null; beteDeNaissanceId: number | null; nom: string; attaque: number; vie: number }>(
    `select r.id as "rencontreId", r.attaque_le as le, r.numero, r.bete_de_naissance_id as "beteDeNaissanceId", e.nom, e.attaque, e.vie
     from rencontre r join espece e on e.id = r.espece_id
     where r.expedition_id = $1 and r.attaque_le is not null`,
    [expeditionId],
  );
  if (attaques.length === 0) return { combats: [], pertes: [] };
  const { rows: escorte } = await client.query<{ especeId: string; nom: string; attaque: number; vie: number; nombre: number; perdues: number }>(
    `select s.espece_id as "especeId", e.nom, e.attaque, e.vie, s.nombre, s.perdues from expedition_escorte s join espece e on e.id = s.espece_id
     where s.expedition_id = $1 order by s.espece_id`,
    [expeditionId],
  );
  const dansLOrdre = dansLOrdreDesCombats(attaques.map((a) => ({ ...a, expeditionId, numero: a.numero === null ? null : Number(a.numero) })));
  return combatsRetrouves(
    escorte.map(({ especeId, nom, nombre, perdues, ...espece }) => ({ especeId, nom, nombre, perdues, force: forceDUneBete(espece) })),
    dansLOrdre.map(({ rencontreId, le, nom, ...espece }) => ({ rencontreId, le, nom, force: forceDUneBete(espece) })),
  );
}
