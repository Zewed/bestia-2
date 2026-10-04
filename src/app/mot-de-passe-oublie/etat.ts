/** Ce que le serveur renvoie au formulaire « Mot de passe oublié ». */
export type EtatOubli = { erreur?: string; envoye?: boolean; email: string };

export const ETAT_OUBLI_INITIAL: EtatOubli = { email: "" };

/** US-0126 : la même réponse, que l'adresse ait un compte ou non. */
export const LIEN_PEUT_ETRE_PARTI = "Si un compte existe pour cette adresse, un e-mail vient de partir.";
