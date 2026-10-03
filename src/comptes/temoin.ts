// Le témoin de connexion, côté navigateur (US-0122) : il dit seulement « connecté ». Le jeu,
// lui, vérifie toujours la vraie session.

/** Vrai si le navigateur porte le témoin de connexion. */
export function temoinDeConnexion(cookies: string): boolean {
  return /(?:^|;\s*)(?:__Host-)?bestia_connecte=1(?:;|$)/.test(cookies);
}
