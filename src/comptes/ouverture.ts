// L'entrée du jeu (créer un compte, se connecter) : visible en local et sur les prévisualisations
// dès maintenant ; en production, seulement quand on peut s'inscrire puis se connecter.

/** Passe à true quand la connexion marche (US-0116) : un nouveau compte peut alors entrer. Jusque-là : « Ouverture prochaine ». */
export const COMPTES_OUVERTS_EN_PRODUCTION = false;

/** Vrai si la page d'accueil montre l'entrée du jeu, et si les pages d'inscription et de connexion répondent. */
export function entreeDuJeuOuverte(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== "production" || COMPTES_OUVERTS_EN_PRODUCTION;
}
