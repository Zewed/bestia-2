// L'e-mail pour changer un mot de passe oublié (US-0126, US-0127) : le loup, « Mot de passe
// oublié ? » et un bouton vers le lien personnel, rien d'autre. Jamais de mot de passe. Côté
// serveur uniquement.
import "server-only";
import { adresseDuSite } from "./confirmation";
import { envoyerEmail, type Email } from "./envoi";
import { miseEnForme } from "./mise-en-forme";

type Env = Record<string, string | undefined>;

export function emailDeReinitialisation(email: string, jeton: string, env: Env = process.env): Email {
  const site = adresseDuSite(env);
  const lien = `${site}/reinitialiser/${jeton}`;
  return {
    a: email,
    sujet: "Mot de passe oublié",
    // Pour les messageries qui n'affichent pas la mise en forme : le lien, seul.
    texte: `Mot de passe oublié ? Changez-le ici :\n${lien}`,
    html: miseEnForme({ titre: "Mot de passe oublié ?", bouton: { texte: "Changer mon mot de passe", lien }, site }),
  };
}

/** Envoie le lien ; un échec est noté dans le journal, sans bloquer (voir envoyerEmail). */
export function envoyerLienReinitialisation(email: string, jeton: string): Promise<boolean> {
  return envoyerEmail(emailDeReinitialisation(email, jeton));
}
