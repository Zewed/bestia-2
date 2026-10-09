// Les règles qui font vivre chaque élément dans le temps. Le Monde n'a encore rien qui évolue :
// avancer, c'est seulement déplacer son marque-page. Un Territoire produit en continu (US-0210), ses
// Habitants y prennent leur Entretien (US-0316) et des Voyageurs s'y présentent de temps en temps (US-0331),
// puis repartent au bout de leur attente s'ils n'ont pas été accueillis (US-0337) ; ses Expéditions y retiennent leurs
// Rencontres, à leur instant exact (US-0932), et y rentrent au Foyer à leur heure (US-0916) : le temps évolue jusqu'au
// retour avant de l'appliquer, toutes les Rencontres du séjour sont donc retenues quand il s'applique ; les guérisons,
// les Attaques s'ajouteront ici.
import "server-only";
import { retenirLesRencontres } from "@/expeditions/rencontres";
import { RETOUR_EXPEDITION, rentrerAuFoyer } from "@/expeditions/retour";
import { produire } from "@/monde/production";
import { ARRIVEE_VOYAGEUR, arriveeDUnVoyageur, DEPART_VOYAGEUR, departDUnVoyageur } from "@/monde/voyageurs";
import type { Regles } from "./avancer";
import type { ElementSuivi } from "./marque-page";

export const REGLES: Record<ElementSuivi, Regles> = {
  monde: {},
  territoire: {
    evoluer: async (client, id, depuis, jusqua) => {
      await produire(client, id, depuis, jusqua);
      await retenirLesRencontres(client, id, depuis, jusqua);
    },
    evenements: { [ARRIVEE_VOYAGEUR]: arriveeDUnVoyageur, [DEPART_VOYAGEUR]: departDUnVoyageur, [RETOUR_EXPEDITION]: rentrerAuFoyer },
  },
};
