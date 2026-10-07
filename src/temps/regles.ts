// Les règles qui font vivre chaque élément dans le temps. Le Monde n'a encore rien qui évolue :
// avancer, c'est seulement déplacer son marque-page. Un Territoire produit en continu (US-0210) et ses
// Habitants y prennent leur Entretien (US-0316) ;
// les guérisons, les Attaques s'ajouteront ici.
import "server-only";
import { produire } from "@/monde/production";
import type { Regles } from "./avancer";
import type { ElementSuivi } from "./marque-page";

export const REGLES: Record<ElementSuivi, Regles> = {
  monde: {},
  territoire: { evoluer: produire },
};
