// L'état d'un Habitant (US-0303), tel que la page Habitants le montre sur sa ligne. Côté serveur comme dans le navigateur.

/** US-0303 : au Foyer et disponible. */
export const LIBRE = "libre";

/** US-0911 : parti avec une Expédition, jusqu'à son retour : il n'est proposé nulle part ailleurs, et son Métier ne change plus. */
export const EN_EXPEDITION = "en Expédition";

/** Ce que fait un Habitant. Les Élevages, les Récoltes et les chantiers en ajouteront d'autres. */
export type EtatHabitant = typeof LIBRE | typeof EN_EXPEDITION;
