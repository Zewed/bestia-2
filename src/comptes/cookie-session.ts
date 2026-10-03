// Le cookie de session (US-0116, US-0119), côté serveur. Illisible par la page (httpOnly),
// envoyé seulement en HTTPS en ligne, et jamais vers un autre site (SameSite=Lax). Il porte
// une date de fin : fermer l'onglet ou le navigateur ne déconnecte pas.
import "server-only";
import { cookies } from "next/headers";
import { getPool } from "@/db";
import { compteDeLaSession } from "./session";

type Env = Record<string, string | undefined>;

/** En ligne, le préfixe __Host- interdit au cookie de sortir de ce site ou de passer en clair. */
export function nomDuCookie(env: Env = process.env): string {
  return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" ? "__Host-bestia_session" : "bestia_session";
}

/**
 * Le témoin de connexion (US-0122) : un second cookie, sans aucun secret, qui dit seulement
 * « connecté ». La page d'accueil, statique, le lit dans le navigateur pour proposer de
 * retourner au jeu. Il suit la session : posé, prolongé et retiré avec elle.
 */
export function nomDuTemoin(env: Env = process.env): string {
  return nomDuCookie(env).replace("bestia_session", "bestia_connecte");
}

/** Les réglages du cookie, les mêmes à la connexion et à chaque prolongation. */
export function reglagesDuCookie(expireLe: Date, env: Env = process.env) {
  return { httpOnly: true, secure: nomDuCookie(env).startsWith("__Host-"), sameSite: "lax" as const, path: "/", expires: expireLe };
}

/** Les réglages du témoin : ceux du cookie de session, mais lisible par la page. */
export function reglagesDuTemoin(expireLe: Date, env: Env = process.env) {
  return { ...reglagesDuCookie(expireLe, env), httpOnly: false };
}

export async function poserCookieSession(jeton: string, expireLe: Date): Promise<void> {
  const pot = await cookies();
  pot.set(nomDuCookie(), jeton, reglagesDuCookie(expireLe));
  pot.set(nomDuTemoin(), "1", reglagesDuTemoin(expireLe));
}

/** Efface le cookie, avec les mêmes réglages : un cookie __Host- ne s'efface qu'en HTTPS. */
export async function effacerCookieSession(): Promise<void> {
  const pot = await cookies();
  pot.set(nomDuCookie(), "", { ...reglagesDuCookie(new Date(0)), maxAge: 0 });
  pot.set(nomDuTemoin(), "", { ...reglagesDuTemoin(new Date(0)), maxAge: 0 });
}

/** Le jeton de session de ce navigateur, s'il y en a un. */
export async function jetonDeSession(): Promise<string | undefined> {
  return (await cookies()).get(nomDuCookie())?.value;
}

/** Le compte connecté dans ce navigateur, ou null. */
export async function compteConnecte(): Promise<{ id: number; email: string } | null> {
  const jeton = await jetonDeSession();
  return jeton ? compteDeLaSession(getPool(), jeton) : null;
}
