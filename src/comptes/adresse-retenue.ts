// L'adresse retenue entre l'inscription et la connexion (US-0108) : gardée dans la mémoire de
// l'onglet (sessionStorage), jamais dans l'adresse de la page, pour qu'elle n'apparaisse ni
// dans l'historique du navigateur ni dans les journaux des serveurs. Côté navigateur.

const CLE = "bestia.adresse-connexion";

/** Retient l'adresse pour pré-remplir la connexion. Sans mémoire d'onglet (navigation privée stricte), rien ne casse. */
export function retenirAdresse(email: string): void {
  try {
    sessionStorage.setItem(CLE, email);
  } catch {
    // La connexion demandera l'adresse, voilà tout.
  }
}

/** L'adresse retenue, ou une chaîne vide. */
export function lireAdresseRetenue(): string {
  try {
    return sessionStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}
