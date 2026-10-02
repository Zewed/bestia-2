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
