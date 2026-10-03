"use server";

import { getPool } from "@/db";
import { effacerCookieSession, jetonDeSession } from "./cookie-session";
import { fermerSession } from "./session";

/**
 * Se déconnecter (US-0120) : la session est supprimée en base, et le cookie effacé. Le
 * navigateur recharge ensuite la page d'accueil en entier (voir BoutonDeconnexion).
 */
export async function seDeconnecter(): Promise<void> {
  const jeton = await jetonDeSession();
  if (jeton) await fermerSession(getPool(), jeton);
  await effacerCookieSession();
}
