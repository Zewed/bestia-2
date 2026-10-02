// Les règles qui font vivre chaque élément dans le temps. Le Monde n'a encore rien qui
// évolue ; la production des Territoires, les guérisons, les Attaques s'ajouteront ici.
import "server-only";
import type { Regles } from "./avancer";
import type { ElementSuivi } from "./marque-page";

export const REGLES: Record<ElementSuivi, Regles> = {
  monde: {},
};
