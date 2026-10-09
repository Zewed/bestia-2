// Le brouillard levé sur le chemin des Expéditions (US-0914) : là où passe une Expédition, le brouillard se lève pour son
// Territoire, Case après Case, à l'heure de son passage (passagesDUneExpedition, src/expeditions/position.ts), puis autour
// de sa destination à son arrivée. Il se lève par decouvrir (src/monde/brouillard.ts, US-0442), la seule écriture du
// brouillard : levé, il le reste pour toujours, et pour ce Territoire seulement. Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { decouvrir } from "@/monde/brouillard";
import { casesDansLeRayon, type Coordonnees } from "@/monde/hex";
import { BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES, BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES } from "@/reglages";
import type { HorairesDUneExpedition } from "./phase";
import { passagesDUneExpedition } from "./position";

/**
 * US-0914 : les Cases qu'une Expédition partie du `foyer` vers la `destination` a sorties du brouillard à l'instant du jeu
 * `instant`, chacune une fois : chaque Case de son chemin déjà atteinte et ses voisines à
 * BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES Cases ; la destination, une fois atteinte (à l'arrivée), et ses voisines à
 * BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES Cases, Biome compris comme toute Case découverte. Rien au départ, ni tant
 * que son trajet n'est pas chiffré ; rien de neuf pendant le séjour ni au retour, qui repasse par le même chemin. Ne
 * dépend que de ses horaires et de l'instant : les mêmes Cases en direct qu'au rattrapage d'une absence. Certaines
 * peuvent manquer au Monde, au bord : decouvrir les passe.
 */
export function casesRevelees(foyer: Coordonnees, destination: Coordonnees, horaires: HorairesDUneExpedition, instant: Date): Coordonnees[] {
  const revelees = new Map<string, Coordonnees>();
  for (const { case: laCase, le } of passagesDUneExpedition(foyer, destination, horaires)) {
    if (le.getTime() > instant.getTime()) break;
    const surLaDestination = laCase.q === destination.q && laCase.r === destination.r;
    const rayon = surLaDestination ? BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES : BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES;
    for (const c of casesDansLeRayon(laCase, rayon)) revelees.set(`${c.q},${c.r}`, c);
  }
  return [...revelees.values()];
}

/**
 * US-0914 : lève le brouillard du Territoire là où ses Expéditions sont passées de l'instant du jeu `depuis` (exclu) à
 * `jusqua` (compris) : l'évolution continue du Territoire (src/temps/regles.ts), en direct comme au rattrapage d'une
 * absence ou par la tâche planifiée. Chaque Expédition passée sur une Case de son chemin pendant la période y découvre
 * toutes les Cases qu'elle a révélées à `jusqua` (casesRevelees) ; les autres, rien : une seule écriture par passage.
 * Découvrir une Case déjà découverte ne change rien (US-0441) : le brouillard levé ne dépend que des horaires et de
 * l'instant, jamais du découpage du temps. Une Expédition déjà en route quand le brouillard a commencé à se lever sur les
 * chemins lève ainsi tout son chemin à son passage suivant ; une déjà arrivée garde le sien. Le chemin part du Foyer du
 * Territoire, comme sur la carte (US-0913) ; une destination hors du Monde de son Foyer (après la bascule d'un Monde)
 * ne lève rien.
 */
export async function leverLeBrouillard(client: PoolClient, territoireId: number, depuis: Date, jusqua: Date): Promise<void> {
  // Une Expédition qui passe sur une Case pendant la période est à l'aller : partie avant sa fin, arrivée après son début.
  const { rows } = await client.query<HorairesDUneExpedition & { foyer: Coordonnees; destination: Coordonnees }>(
    `select json_build_object('q', f.q, 'r', f.r) as foyer, json_build_object('q', c.q, 'r', c.r) as destination,
       x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x join territoire t on t.id = x.territoire_id join case_du_monde f on f.id = t.foyer_case_id
       join case_du_monde c on c.id = x.case_id and c.monde_id = f.monde_id
     where x.territoire_id = $1 and x.part_le < $3 and x.part_le + make_interval(mins => x.trajet_minutes) > $2
     order by x.part_le, x.id`,
    [territoireId, depuis, jusqua],
  );
  const cases = new Map<string, Coordonnees>();
  for (const { foyer, destination, ...horaires } of rows) {
    const passages = passagesDUneExpedition(foyer, destination, horaires);
    if (!passages.some(({ le }) => le.getTime() > depuis.getTime() && le.getTime() <= jusqua.getTime())) continue;
    for (const c of casesRevelees(foyer, destination, horaires, jusqua)) cases.set(`${c.q},${c.r}`, c);
  }
  if (cases.size > 0) await decouvrir(client, territoireId, [...cases.values()]);
}
