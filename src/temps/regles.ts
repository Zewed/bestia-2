// Les règles qui font vivre chaque élément dans le temps. Le Monde n'a encore rien qui évolue :
// avancer, c'est seulement déplacer son marque-page. Un Territoire produit en continu (US-0210), ses
// Habitants y prennent leur Entretien (US-0316) et des Voyageurs s'y présentent de temps en temps (US-0331),
// puis repartent au bout de leur attente s'ils n'ont pas été accueillis (US-0337) ; ses Expéditions y rentrent
// au Foyer à leur heure (US-0916) ; le brouillard s'y lève sur leur chemin, à leur passage (US-0914) ; les
// guérisons, les Attaques s'ajouteront ici.
import "server-only";
import { leverLeBrouillard } from "@/expeditions/brouillard";
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
      await leverLeBrouillard(client, id, depuis, jusqua);
    },
    evenements: { [ARRIVEE_VOYAGEUR]: arriveeDUnVoyageur, [DEPART_VOYAGEUR]: departDUnVoyageur, [RETOUR_EXPEDITION]: rentrerAuFoyer },
  },
};
