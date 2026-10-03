/**
 * Ce que le serveur renvoie au formulaire après un envoi : les erreurs par champ (ou générale),
 * et l'adresse saisie. Jamais le mot de passe.
 */
export type EtatInscription = { erreurs: { email?: string; motDePasse?: string; general?: string }; email: string; cree?: boolean };

export const ETAT_INITIAL: EtatInscription = { erreurs: {}, email: "" };

/** US-0111 : le message quand le réseau coupe, que le jeu plante ou ne répond pas. Jamais de détail technique. */
export const JEU_INJOIGNABLE = "Impossible de joindre Bestia, réessayez dans un instant";
