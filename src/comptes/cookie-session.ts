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

/** Les réglages du cookie, les mêmes à la connexion et à chaque prolongation. */
export function reglagesDuCookie(expireLe: Date, env: Env = process.env) {
  return { httpOnly: true, secure: nomDuCookie(env).startsWith("__Host-"), sameSite: "lax" as const, path: "/", expires: expireLe };
}

export async function poserCookieSession(jeton: string, expireLe: Date): Promise<void> {
  (await cookies()).set(nomDuCookie(), jeton, reglagesDuCookie(expireLe));
}

/** Le compte connecté dans ce navigateur, ou null. */
export async function compteConnecte(): Promise<{ id: number; email: string } | null> {
  const jeton = (await cookies()).get(nomDuCookie())?.value;
  return jeton ? compteDeLaSession(getPool(), jeton) : null;
}
