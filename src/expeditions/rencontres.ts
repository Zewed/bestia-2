// La Rencontre (US-0932) : quand une Bête sauvage se montre sur la Case où une Expédition séjourne, ou y est encore quand
// elle arrive, l'Expédition la voit. Seule la Case du séjour compte (US-0915, src/expeditions/presence.ts) : les Cases
// traversées à l'aller et au retour ne montrent rien (décidé le 2026-10-09), et un joueur sans Expédition sur la Case
// n'apprend rien de la Bête. Elle voit les Bêtes sauvages ordinaires (src/monde/betes-sauvages.ts) comme les Bêtes de
// naissance de son Territoire, à lui seul réservées (src/monde/betes-de-naissance.ts). Chaque Rencontre est retenue en
// base (table rencontre), à son instant exact, par le mécanisme du temps (src/temps/regles.ts) : en direct, au rattrapage
// ou par la tâche planifiée, les mêmes Rencontres, aux mêmes instants. Le Bestiaire (US-0933), l'Apprivoisement (US-0934)
// et le récit (US-0940) les liront ici. US-0933 : chaque Rencontre retenue inscrit son Espèce au Bestiaire du Territoire,
// dans la même transaction (src/bestiaire/bestiaire.ts). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { inscrireLesEspecesCroisees } from "@/bestiaire/bestiaire";
import { betesDeNaissanceDesCases } from "@/monde/betes-de-naissance";
import { betesSauvagesDesCases } from "@/monde/betes-sauvages";
import { expeditionsPresentesDuTerritoire } from "./presence";

/**
 * US-0932 : une Rencontre : l'instant du jeu où l'Expédition a vu la Bête (vueLe), sur sa Case (caseId), et la Bête :
 * l'instant de son apparition, son Espèce et la Rareté de celle-ci ; une Bête sauvage ordinaire par son numéro sur la Case
 * (numero), une Bête de naissance par sa ligne (beteDeNaissanceId), l'autre restant null. US-0933 : nouvelleEspece est vrai
 * pour la Rencontre qui a inscrit son Espèce au Bestiaire du Territoire, la première où le joueur l'a vue : les récits de
 * retour (US-0917) et de Rencontre (US-0940) y liront « Nouvelle Espèce au Bestiaire ».
 */
export type Rencontre = {
  id: number;
  vueLe: Date;
  caseId: number;
  apparueLe: Date;
  especeId: string;
  rareteId: string;
  numero: number | null;
  beteDeNaissanceId: number | null;
  nouvelleEspece: boolean;
};

/** Une Rencontre à retenir : l'Expédition, la Bête, et l'instant où elle la voit. */
type AVoir = { expeditionId: number; numero: number | null; beteDeNaissanceId: number | null; especeId: string; apparueLe: Date; vueLe: Date };

/**
 * US-0932 : retient les Rencontres des Expéditions du Territoire `territoireId` qui tombent dans [de, a) : chaque Bête
 * présente sur la Case d'une Expédition pendant son séjour, vue à l'instant de son apparition, ou de l'arrivée de
 * l'Expédition si elle était déjà là, tant que ni l'une ni l'autre n'est partie. Une Rencontre tombée avant `de` a été
 * retenue avec l'intervalle où elle tombait : rien ne se voit deux fois, quel que soit le découpage du temps. Appelée par
 * le mécanisme du temps, dans la transaction du rattrapage.
 */
export async function retenirLesRencontres(base: Pool | PoolClient, territoireId: number, de: Date, a: Date): Promise<void> {
  const expeditions = await expeditionsPresentesDuTerritoire(base, territoireId, de, a);
  if (expeditions.length === 0) return;
  const caseIds = [...new Set(expeditions.map((x) => x.caseId))];
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  const sauvages = await betesSauvagesDesCases(base, caseIds, de, a);
  const deNaissance = await betesDeNaissanceDesCases(base, territoireId, caseIds, de, a);
  const aVoir: AVoir[] = [];
  for (const x of expeditions) {
    const betes = [
      ...sauvages.get(x.caseId)!.map((b) => ({ ...b, beteDeNaissanceId: null })),
      ...deNaissance.get(x.caseId)!.map((b) => ({ ...b, numero: null, beteDeNaissanceId: b.id })),
    ];
    for (const b of betes) {
      // Vue dès que la Bête et l'Expédition sont toutes deux sur la Case, si aucune n'en est partie.
      const vueLe = Math.max(b.arrivee.getTime(), x.arrivee.getTime());
      if (vueLe < de.getTime() || vueLe >= a.getTime() || vueLe >= Math.min(b.depart.getTime(), x.depart.getTime())) continue;
      aVoir.push({ expeditionId: x.id, numero: b.numero, beteDeNaissanceId: b.beteDeNaissanceId, especeId: b.especeId, apparueLe: b.arrivee, vueLe: new Date(vueLe) });
    }
  }
  if (aVoir.length === 0) return;
  // « on conflict do nothing » : une Expédition ne rencontre qu'une fois chaque Bête.
  const { rowCount } = await base.query(
    `insert into rencontre (expedition_id, numero, bete_de_naissance_id, espece_id, apparue_le, vue_le)
     select * from unnest($1::int[], $2::bigint[], $3::int[], $4::text[], $5::timestamptz[], $6::timestamptz[])
     on conflict do nothing`,
    [
      aVoir.map((r) => r.expeditionId),
      aVoir.map((r) => r.numero),
      aVoir.map((r) => r.beteDeNaissanceId),
      aVoir.map((r) => r.especeId),
      aVoir.map((r) => r.apparueLe),
      aVoir.map((r) => r.vueLe),
    ],
  );
  // US-0933 : l'Espèce de chaque Bête vue entre au Bestiaire, qu'elle suive l'Expédition ou non.
  if (rowCount) await inscrireLesEspecesCroisees(base, territoireId);
}

/**
 * US-0932 : les Rencontres de l'Expédition `expeditionId` retenues jusqu'ici, dans l'ordre des apparitions : celles des
 * Bêtes déjà là à son arrivée, puis les suivantes, chacune à son heure.
 */
export async function rencontresDUneExpedition(base: Pool | PoolClient, expeditionId: number): Promise<Rencontre[]> {
  const { rows } = await base.query<Omit<Rencontre, "numero"> & { numero: string | null }>(
    `select r.id, r.vue_le as "vueLe", x.case_id as "caseId", r.apparue_le as "apparueLe", r.espece_id as "especeId",
       e.rarete_id as "rareteId", r.numero, r.bete_de_naissance_id as "beteDeNaissanceId",
       exists (select 1 from bestiaire b where b.rencontre_id = r.id) as "nouvelleEspece"
     from rencontre r join expedition x on x.id = r.expedition_id join espece e on e.id = r.espece_id
     where r.expedition_id = $1
     order by r.apparue_le, r.id`,
    [expeditionId],
  );
  return rows.map((r) => ({ ...r, numero: r.numero === null ? null : Number(r.numero) }));
}
