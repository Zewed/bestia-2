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
/** US-0119 : une session dure 30 jours, prolongés à chaque visite… */
export const SESSION_JOURS = 30;
/** … au plus une fois par jour, pour ne pas écrire en base à chaque page. */
export const SESSION_PROLONGEE_APRES_HEURES = 24;
/** US-0118 : après 5 échecs de connexion d'affilée sur une même adresse… */
export const ECHECS_CONNEXION_MAX = 5;
/** … les essais sont bloqués 15 minutes. */
export const BLOCAGE_CONNEXION_MINUTES = 15;
/** US-0126, US-0127 : un lien pour changer de mot de passe reste valable 60 minutes… */
export const LIEN_REINITIALISATION_MINUTES = 60;
/** … et on n'en envoie pas plus d'un par minute pour une même adresse, pour ne pas inonder une boîte. */
export const NOUVELLE_REINITIALISATION_ATTENTE_SECONDES = 60;
/** US-0130 : … ni plus de 5 en une heure. */
export const REINITIALISATIONS_PAR_HEURE_MAX = 5;
/** US-0132 : un nom de chef compte de 3 à 16 caractères, tels qu'on les voit (« É » en vaut un). */
export const NOM_DE_CHEF_MIN = 3;
export const NOM_DE_CHEF_MAX = 16;
/** US-0136 : la disponibilité du nom est cherchée après une demi-seconde sans frappe. */
export const NOM_DE_CHEF_PAUSE_MS = 500;

/** US-0151 : le Monde est un disque d'hexagones de 60 anneaux autour du Cœur sauvage… */
export const MONDE_RAYON = 60;
/**
 * … dont les 6 anneaux extérieurs forment la Couronne, où naissent les joueurs (US-0152 : environ 90
 * Foyers). Elle peut s'élargir vers l'intérieur, jamais rétrécir : une Case créée reste.
 */
export const COURONNE_ANNEAUX = 6;
/** US-0152 : deux Foyers sont toujours à au moins 4 Cases l'un de l'autre. */
export const ECART_ENTRE_FOYERS = 4;
/** US-0153 : un nouveau chef naît au hasard parmi les 5 emplacements libres les plus proches du dernier arrivé. */
export const NAISSANCE_PARMI_LES_PLUS_PROCHES = 5;
/** US-0159 : sous 10 places de Foyer restantes dans un Monde, chaque naissance donne l'alerte. */
export const ALERTE_PLACES_DE_FOYER = 10;
/**
 * La part de chaque Biome sur la Couronne, en régions d'un seul tenant. La prairie domine : les
 * Foyers n'y naissent que là. L'eau de la Couronne est faite de lacs.
 */
export const BIOMES_DE_LA_COURONNE = { prairie: 0.4, foret: 0.25, montagne: 0.1, savane: 0.1, eau: 0.1, desert: 0.05 } as const;
/** La taille des régions de Biome, en Cases à peu près : plus le nombre est grand, plus elles s'étendent. */
export const TAILLE_DES_REGIONS = 16;

