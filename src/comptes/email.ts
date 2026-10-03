// La règle de l'adresse e-mail, une seule fois : le navigateur l'applique quand on quitte le
// champ, le serveur la refait à l'envoi (US-0103). Pas de « server-only » : les deux s'en servent.

export const EMAIL_VIDE = "Indiquez votre adresse e-mail";
export const EMAIL_INVALIDE = "Cette adresse e-mail n'est pas valide";

/** La longueur maximale d'une adresse e-mail (RFC 5321). */
const LONGUEUR_MAX = 254;

/** Un nom, une arobase, un domaine avec au moins un point ; ni espace, ni seconde arobase. */
const FORME = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@]+$/;

/** Le message à afficher sous le champ, ou null si l'adresse est bien écrite. Les espaces autour ne comptent pas. */
export function verifierEmail(valeur: string): string | null {
  const email = valeur.trim();
  if (email === "") return EMAIL_VIDE;
  if (email.length > LONGUEUR_MAX || !FORME.test(email)) return EMAIL_INVALIDE;
  return null;
}

/**
 * La forme sous laquelle une adresse est enregistrée et cherchée (US-0104) : sans espaces
 * autour, en minuscules. « Nom@Exemple.fr » et « nom@exemple.fr » désignent le même compte.
 */
export function normaliserEmail(valeur: string): string {
  return valeur.trim().toLowerCase();
}
