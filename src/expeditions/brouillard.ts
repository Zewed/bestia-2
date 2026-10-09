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
  const passages = passagesDUneExpedition(foyer, destination, horaires);
  for (const { case: laCase, rang, le } of passages) {
    if (le.getTime() > instant.getTime()) break;
    const rayon = rang === passages.length ? BROUILLARD_LEVE_AUTOUR_DE_LA_DESTINATION_CASES : BROUILLARD_LEVE_SUR_LE_CHEMIN_CASES;
    for (const c of casesDansLeRayon(laCase, rayon)) revelees.set(`${c.q},${c.r}`, c);
  }
  return [...revelees.values()];
}

/**
 * US-0914 : lève le brouillard du Territoire là où ses Expéditions sont passées jusqu'à l'instant du jeu `jusqua` :
 * l'évolution continue du Territoire de `depuis` à `jusqua` (src/temps/regles.ts), en direct comme au rattrapage d'une
 * absence ou par la tâche planifiée. Chacune de ses Expéditions encore dehors à `depuis` y découvre toutes les Cases
 * qu'elle a révélées à `jusqua` (casesRevelees). Découvrir une Case déjà découverte ne change rien (US-0441) : le
 * brouillard levé ne dépend que des horaires et de l'instant, jamais du découpage du temps, et une Expédition partie avant
 * cette story lève tout son chemin au premier rattrapage. Le chemin part du Foyer du Territoire, comme sur la carte (US-0913).
 */
export async function leverLeBrouillard(client: PoolClient, territoireId: number, depuis: Date, jusqua: Date): Promise<void> {
  const { rows } = await client.query<HorairesDUneExpedition & { foyer: Coordonnees; destination: Coordonnees }>(
    `select json_build_object('q', f.q, 'r', f.r) as foyer, json_build_object('q', c.q, 'r', c.r) as destination,
       x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x join territoire t on t.id = x.territoire_id join case_du_monde f on f.id = t.foyer_case_id
       join case_du_monde c on c.id = x.case_id
     where x.territoire_id = $1 and x.part_le < $3 and x.part_le + make_interval(mins => 2 * x.trajet_minutes + x.sejour_minutes) > $2
     order by x.part_le, x.id`,
    [territoireId, depuis, jusqua],
  );
  const cases = new Map<string, Coordonnees>();
  for (const { foyer, destination, ...horaires } of rows) {
    for (const c of casesRevelees(foyer, destination, horaires, jusqua)) cases.set(`${c.q},${c.r}`, c);
  }
  if (cases.size > 0) await decouvrir(client, territoireId, [...cases.values()]);
}
