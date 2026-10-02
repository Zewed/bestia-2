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
