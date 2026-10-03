/**
 * Ce que le serveur renvoie au formulaire après un envoi : les erreurs par champ, et l'adresse
 * saisie. Jamais le mot de passe.
 */
export type EtatInscription = { erreurs: { email?: string; motDePasse?: string }; email: string };

export const ETAT_INITIAL: EtatInscription = { erreurs: {}, email: "" };
