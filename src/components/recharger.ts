// Un rechargement complet vers une autre page, sans garder la page actuelle dans l'historique.
// Isolé ici pour que les tests puissent l'observer (jsdom ne sait pas naviguer).
export function rechargerVers(chemin: string): void {
  window.location.replace(chemin);
}
