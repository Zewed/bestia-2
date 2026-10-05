// Les règles qui font vivre chaque élément dans le temps. Ni le Monde ni les Territoires n'ont
// encore rien qui évolue : avancer, c'est seulement déplacer leur marque-page. La production
// des Territoires (jalon 2), les guérisons, les Attaques s'ajouteront ici.
import "server-only";
import type { Regles } from "./avancer";
import type { ElementSuivi } from "./marque-page";

export const REGLES: Record<ElementSuivi, Regles> = {
  monde: {},
  territoire: {},
};
