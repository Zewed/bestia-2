// L'entrée du jeu (créer un compte, se connecter) : visible en local et sur les prévisualisations
// dès maintenant ; en production, seulement quand un nouveau joueur peut vraiment commencer.

/**
 * Passe à true quand un nouveau joueur peut vraiment commencer (nom de chef et premières Bêtes)
 * et que les e-mails partent (Zewed/bestia-2#1). Jusque-là : « Ouverture prochaine ».
 */
export const COMPTES_OUVERTS_EN_PRODUCTION = false;

/** Vrai si la page d'accueil montre l'entrée du jeu, et si les pages d'inscription et de connexion répondent. */
export function entreeDuJeuOuverte(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== "production" || COMPTES_OUVERTS_EN_PRODUCTION;
}
