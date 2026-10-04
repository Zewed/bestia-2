/** Ce que le serveur renvoie au formulaire « Nouveau mot de passe » quand il refuse. */
export type EtatNouveauMotDePasse = { erreur?: string; lienPerime?: boolean };

export const ETAT_NOUVEAU_INITIAL: EtatNouveauMotDePasse = {};

/** Le lien ne sert plus (expiré ou déjà utilisé) ; le vrai message arrive avec US-0129. */
export const LIEN_PERIME = "Ce lien n'est plus valable.";
