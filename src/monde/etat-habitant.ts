// L'état d'un Habitant (US-0303), tel que la page Habitants le montre sur sa ligne. Côté serveur comme dans le navigateur.

/** US-0303 : au Foyer et disponible. */
export const LIBRE = "libre";

/** US-0911 : parti avec une Expédition, jusqu'à son retour : il n'est proposé nulle part ailleurs, et son Métier ne change plus. */
export const EN_EXPEDITION = "en Expédition";

/** US-0843 : l'éleveur pendant son Élevage, jusqu'à la fin : son Métier ne change plus, comme celui d'un explorateur parti. */
export const A_L_ELEVAGE = "à l'Élevage";

/** US-0843 : l'état d'un éleveur à l'Élevage, avec l'Espèce qu'il élève : « à l'Élevage · Poule ». */
export const aLElevage = (espece: string) => `${A_L_ELEVAGE} · ${espece}` as const;

/** Ce que fait un Habitant. Les Récoltes et les chantiers en ajouteront d'autres. */
export type EtatHabitant = typeof LIBRE | typeof EN_EXPEDITION | ReturnType<typeof aLElevage>;

/**
 * US-0843 : un Habitant occupé ailleurs, en Expédition (US-0911) ou à l'Élevage : son Métier ne change pas et il ne se
 * renvoie pas avant d'en revenir. Tout état autre que « libre » l'est.
 */
export const occupe = (etat: string) => etat !== LIBRE;
