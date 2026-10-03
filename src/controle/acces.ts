// L'accès aux pages de contrôle : réservées aux développeurs, reconnus par le mot de passe
// de contrôle (CONTROLE_MOT_DE_PASSE) en attendant les comptes. Sans ce réglage, elles restent fermées.
import { createHash, timingSafeEqual } from "node:crypto";

/** Ce que le serveur répond pour que le navigateur demande le mot de passe. */
export const DEMANDE_MOT_DE_PASSE = 'Basic realm="Bestia - controle", charset="UTF-8"';

const empreinte = (texte: string) => createHash("sha256").update(texte).digest();

/**
 * Vrai si l'en-tête Authorization porte le mot de passe de contrôle. Le nom saisi ne compte
 * pas. La comparaison prend le même temps quel que soit le mot de passe essayé.
 */
export function motDePasseAccepte(authorization: string | null, attendu = process.env.CONTROLE_MOT_DE_PASSE): boolean {
  if (!attendu?.trim() || !authorization?.startsWith("Basic ")) return false;
  const identifiants = Buffer.from(authorization.slice("Basic ".length), "base64").toString("utf8");
  const deuxPoints = identifiants.indexOf(":");
  if (deuxPoints < 0) return false;
  return timingSafeEqual(empreinte(identifiants.slice(deuxPoints + 1)), empreinte(attendu));
}
