// L'e-mail de confirmation d'adresse (US-0114). Côté serveur uniquement.
import "server-only";
import { LIEN_CONFIRMATION_HEURES } from "@/reglages";
import { envoyerEmail, type Email } from "./envoi";

type Env = Record<string, string | undefined>;

/**
 * L'adresse du site pour les liens des e-mails. Elle vient des réglages, jamais de la requête :
 * un en-tête « Host » trafiqué ne peut pas glisser un autre site dans un e-mail.
 */
export function adresseDuSite(env: Env = process.env): string {
  const choisie = env.BESTIA_ADRESSE_SITE?.trim();
  if (choisie) return choisie.replace(/\/+$/, "");
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function emailDeConfirmation(email: string, jeton: string, env: Env = process.env): Email {
  const lien = `${adresseDuSite(env)}/confirmer/${jeton}`;
  return {
    a: email,
    sujet: "Confirmez votre adresse e-mail",
    texte: [
      "Bonjour,",
      "",
      "Pour confirmer votre adresse e-mail sur Bestia, ouvrez ce lien :",
      lien,
      "",
      `Il reste valable ${LIEN_CONFIRMATION_HEURES} heures. Si vous n'avez pas créé de compte sur Bestia, ignorez simplement cet e-mail.`,
    ].join("\n"),
  };
}

/** Envoie le lien de confirmation ; un échec est noté dans le journal, sans bloquer (voir envoyerEmail). */
export function envoyerLienConfirmation(email: string, jeton: string): Promise<boolean> {
  return envoyerEmail(emailDeConfirmation(email, jeton));
}
