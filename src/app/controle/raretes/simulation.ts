// US-0931 : la simulation des Raretés par Anneau : les Bêtes sauvages qu'un Monde généré fait apparaître sur une longue
// période, comptées Anneau par Anneau, pour vérifier que leurs Raretés suivent les pourcentages de chaque Anneau
// (donnees/raretes-par-anneau.yaml). Un calcul pur, par les fonctions mêmes du jeu : rien n'est lu ni écrit en base.
import type { ChancesDeRarete } from "@/donnees/jeux";
import { anneauDUneCase, type FormeDuMonde } from "@/monde/anneaux";
import { apparitions, rareteTiree, raretesParAnneau } from "@/monde/betes-sauvages";
import { casesDesAnneaux } from "@/monde/hex";
import { COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, MONDE_RAYON, SIMULATION_DES_RARETES_JOURS, SIMULATION_DES_RARETES_TOLERANCE_POINTS } from "@/reglages";

const JOUR_MS = 86_400_000;

/** La forme d'un Monde généré aujourd'hui (src/reglages.ts). */
const FORME_D_UN_MONDE: FormeDuMonde = { rayon: MONDE_RAYON, anneauxCouronne: COURONNE_ANNEAUX, rayonCoeur: COEUR_SAUVAGE_RAYON };

/**
 * La période simulée commence toujours au même instant, l'origine des tranches du temps du jeu (betes-sauvages.ts) : une
 * même graine donne toujours le même résultat, qui ne change qu'avec les réglages et la table des Raretés.
 */
const DEBUT_SIMULE = new Date(0);

/** Une Rareté dans un Anneau : sa part obtenue et sa part attendue, en pourcentages, et si leur écart dépasse la tolérance. */
export type PartDUneRarete = { rareteId: string; obtenue: number; attendue: number; horsTolerance: boolean };

/** Un Anneau simulé : ses Cases, ses apparitions, leur nombre moyen par Case et par jour, et la part de chaque Rareté. */
export type AnneauSimule = {
  anneau: number;
  cases: number;
  apparitions: number;
  parCaseParJour: number;
  /** De la commune à la plus rare, dans l'ordre de la table. */
  raretes: PartDUneRarete[];
  communesMajoritaires: boolean;
};

export type SimulationDesRaretes = { jours: number; tolerance: number; anneaux: AnneauSimule[]; reussie: boolean };

/**
 * US-0931 : les apparitions de toutes les Cases d'un Monde de graine `graine` et de forme `forme` pendant `jours` jours du
 * jeu à partir de `de`, et la Rareté que chacune tire aux chances de l'Anneau de sa Case (`chances`, celles des données du
 * jeu). Un Monde généré n'a encore aucun Territoire : toutes ses Cases en voient apparaître. On compte la Rareté tirée, avant
 * le choix de l'Espèce : celui-ci la fait retomber quand le Biome n'a aucune Espèce de cette Rareté (US-0928), ce qui
 * dépend des Espèces en base et non de la table. Le contrôle échoue si, dans un Anneau, une part obtenue s'écarte de plus
 * de `tolerance` points de sa part attendue, ou si les communes n'y font pas plus de la moitié des apparitions.
 */
export function simulerLesRaretes({
  graine,
  de = DEBUT_SIMULE,
  forme = FORME_D_UN_MONDE,
  jours = SIMULATION_DES_RARETES_JOURS,
  tolerance = SIMULATION_DES_RARETES_TOLERANCE_POINTS,
  chances = raretesParAnneau(),
}: {
  graine: number;
  de?: Date;
  forme?: FormeDuMonde;
  jours?: number;
  tolerance?: number;
  chances?: ChancesDeRarete[];
}): SimulationDesRaretes {
  const a = new Date(de.getTime() + jours * JOUR_MS);
  const comptes = chances.map(() => ({ cases: 0, apparitions: 0, parRarete: new Map<string, number>() }));
  for (const c of casesDesAnneaux(0, forme.rayon)) {
    const anneau = anneauDUneCase(c, forme, chances.length);
    const compte = comptes[anneau - 1];
    compte.cases++;
    for (const { numero } of apparitions(graine, c, de, a)) {
      const rareteId = rareteTiree({ ...c, graine, anneau }, numero, chances);
      compte.apparitions++;
      compte.parRarete.set(rareteId, (compte.parRarete.get(rareteId) ?? 0) + 1);
    }
  }
  const anneaux = comptes.map(({ cases, apparitions: nombre, parRarete }, i) => {
    const raretes = chances[i].map(({ rareteId, pourcent }) => {
      const obtenue = nombre === 0 ? 0 : (100 * (parRarete.get(rareteId) ?? 0)) / nombre;
      return { rareteId, obtenue, attendue: pourcent, horsTolerance: Math.abs(obtenue - pourcent) > tolerance };
    });
    // Les communes : la première Rareté de la table, la plus banale.
    return { anneau: i + 1, cases, apparitions: nombre, parCaseParJour: nombre / (cases * jours), raretes, communesMajoritaires: raretes[0].obtenue > 50 };
  });
  const reussie = anneaux.every((x) => x.communesMajoritaires && !x.raretes.some((r) => r.horsTolerance));
  return { jours, tolerance, anneaux, reussie };
}
