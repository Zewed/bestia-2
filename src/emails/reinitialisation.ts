// L'e-mail pour changer un mot de passe oublié (US-0126 ; sa forme soignée vient avec US-0127).
// Côté serveur uniquement.
import "server-only";
import { LIEN_REINITIALISATION_MINUTES } from "@/reglages";
import { adresseDuSite } from "./confirmation";
import { envoyerEmail, type Email } from "./envoi";

type Env = Record<string, string | undefined>;

export function emailDeReinitialisation(email: string, jeton: string, env: Env = process.env): Email {
  const lien = `${adresseDuSite(env)}/reinitialiser/${jeton}`;
  return {
    a: email,
    sujet: "Changer votre mot de passe Bestia",
    texte: [
      "Bonjour,",
      "",
      "Vous avez demandé à changer votre mot de passe Bestia. Ouvrez ce lien pour en choisir un nouveau :",
      lien,
      "",
      `Il reste valable ${LIEN_REINITIALISATION_MINUTES} minutes. Si vous n'avez rien demandé, ignorez simplement cet e-mail : votre mot de passe ne change pas.`,
    ].join("\n"),
  };
}

/** Envoie le lien ; un échec est noté dans le journal, sans bloquer (voir envoyerEmail). */
export function envoyerLienReinitialisation(email: string, jeton: string): Promise<boolean> {
  return envoyerEmail(emailDeReinitialisation(email, jeton));
}
