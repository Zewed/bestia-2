/** Ce que le serveur renvoie au formulaire « Nouveau mot de passe » quand il refuse. */
export type EtatNouveauMotDePasse = { erreur?: string; lien?: LienHorsService };

export const ETAT_NOUVEAU_INITIAL: EtatNouveauMotDePasse = {};

/** US-0129 : pourquoi un lien ne sert plus. */
export type LienHorsService = "expire" | "utilise" | "inconnu";

/** Ce que la page dit d'un lien qui ne sert plus, et où elle propose d'aller. */
export const LIEN_HORS_SERVICE: Record<LienHorsService, { titre: string; bouton: { texte: string; lien: string } }> = {
  expire: { titre: "Ce lien a expiré", bouton: { texte: "Recevoir un nouveau lien", lien: "/mot-de-passe-oublie" } },
  utilise: { titre: "Ce lien a déjà servi", bouton: { texte: "Se connecter", lien: "/connexion" } },
  inconnu: { titre: "Ce lien n'est pas valable", bouton: { texte: "Recevoir un nouveau lien", lien: "/mot-de-passe-oublie" } },
};
