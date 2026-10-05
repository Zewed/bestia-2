/** La réponse à la validation du nom (US-0139), pour le nom envoyé : refusé, ou pris par un autre chef. */
export type EtatValidation = { nom: string; erreur?: string; pris?: boolean };

export const ETAT_VALIDATION_INITIAL: EtatValidation = { nom: "" };

/** US-0139 : le nom de chef ne change plus une fois validé. */
export const NOM_DEFINITIF = "Ce nom ne pourra plus être changé";
