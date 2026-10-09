// Affichage des instants, côté serveur comme dans le navigateur.

/**
 * Affiche un instant dans le fuseau d'un joueur. Les instants sont enregistrés en temps
 * universel ; seul l'affichage change d'un fuseau à l'autre.
 */
export function formaterInstant(instant: Date, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: fuseau,
  }).format(instant);
}

/**
 * US-0903 : le jour et l'heure d'un retour, dans le fuseau d'un joueur, sans l'année : « 9 octobre à 14:05 ». US-0910 :
 * de même pour l'heure de retour prévue du récapitulatif.
 */
export function formaterJourEtHeure(instant: Date, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: fuseau }).format(instant);
}

/**
 * US-0226 : une durée à venir, arrondie à la minute supérieure : « 45 min », « 3 h 05 », puis au-delà
 * de 24 heures, en jours et en heures : « 2 j 5 h ».
 */
export function formaterDuree(heures: number): string {
  return formaterMinutes(Math.max(1, Math.ceil(heures * 60)));
}

/**
 * US-0906 : une durée en minutes entières, écrite comme formaterDuree, sans repasser par les heures (où 500 minutes,
 * arrondies à la minute supérieure, deviendraient 501) : « 30 min », « 8 h 20 », « 1 j ».
 */
export function formaterMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const reste = minutes % 60;
    return reste === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${String(reste).padStart(2, "0")}`;
  }
  const jours = Math.floor(minutes / (24 * 60));
  const heuresRestantes = Math.floor((minutes % (24 * 60)) / 60);
  return heuresRestantes === 0 ? `${jours} j` : `${jours} j ${heuresRestantes} h`;
}

/** US-0940 : l'heure d'une Rencontre, dans le fuseau d'un joueur, sans le jour, que son Récit donne déjà : « 14:05 ». */
export function formaterHeure(instant: Date, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: fuseau }).format(instant);
}
