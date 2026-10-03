/** Ce que le serveur renvoie au formulaire de connexion quand il refuse : le message, et l'adresse saisie. */
export type EtatConnexion = { erreur?: string; email: string };

export const ETAT_CONNEXION_INITIAL: EtatConnexion = { email: "" };

/** US-0117 : le refus, le même que l'adresse soit inconnue ou le mot de passe faux. */
export const CONNEXION_REFUSEE = "Adresse ou mot de passe incorrect";
