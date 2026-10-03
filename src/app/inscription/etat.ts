/** Ce que le serveur renvoie au formulaire après un envoi : les erreurs par champ, et l'adresse saisie. */
export type EtatInscription = { erreurs: { email?: string }; email: string };

export const ETAT_INITIAL: EtatInscription = { erreurs: {}, email: "" };
