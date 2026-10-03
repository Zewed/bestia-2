// Les chiffres réglables du jeu, rassemblés ici. Chaque valeur renvoie à la story qui la fixe.

/** US-0025 : la tâche planifiée passe toutes les 5 minutes (planning dans vercel.json). */
export const TACHE_TEMPS_TOUTES_LES_MINUTES = 5;
/** US-0025 : elle rattrape tout élément qui n'a pas été calculé depuis plus de 5 minutes. */
export const RATTRAPER_APRES_MINUTES = 5;
/** US-0025 : elle travaille par lots de cette taille… */
export const TAILLE_LOT = 50;
/** … et s'arrête au bout de ce temps, pour rester sous la durée permise par Vercel. */
export const BUDGET_TACHE_MS = 45_000;
/** US-0029 : les passages de la tâche planifiée restent consultables 7 jours. */
export const JOURNAL_TACHE_JOURS = 7;
/** US-0029 : sans passage depuis ce délai (trois passages manqués), la tâche est signalée en retard. */
export const TACHE_EN_RETARD_MINUTES = 15;
/** US-0105 : un mot de passe compte au moins 12 caractères, sans autre contrainte (longueur plutôt que complexité)… */
export const MOT_DE_PASSE_MIN = 12;
/** … et au plus 128, assez pour une phrase de passe. */
export const MOT_DE_PASSE_MAX = 128;
/** US-0111 : sans réponse du jeu au bout de ce délai, l'inscription prévient qu'il est injoignable. */
export const INSCRIPTION_DELAI_MAX_MS = 15_000;
/** US-0112 : au plus 5 comptes créés en une heure depuis une même connexion. */
export const INSCRIPTIONS_PAR_HEURE_MAX = 5;
/** US-0113 : l'adresse d'où partent les e-mails du jeu (domaine à vérifier chez Resend, voir Zewed/bestia-2#1). */
export const EXPEDITEUR_EMAILS = "Bestia <bonjour@bestia.thevibecompany.co>";
/** US-0113 : au-delà, l'envoi d'un e-mail est abandonné et noté comme raté. */
export const ENVOI_EMAIL_DELAI_MAX_MS = 10_000;
/** US-0114 : un lien de confirmation d'adresse reste valable 24 heures… */
export const LIEN_CONFIRMATION_HEURES = 24;
/** … et on n'en renvoie pas un nouveau plus d'une fois par minute, pour ne pas inonder une boîte. */
export const NOUVEAU_LIEN_ATTENTE_SECONDES = 60;
/** US-0116 : une session dure 30 jours (valeur provisoire, à fixer avec US-0119). */
export const SESSION_JOURS = 30;
