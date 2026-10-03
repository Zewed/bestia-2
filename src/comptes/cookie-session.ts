// Le cookie de session (US-0116), côté serveur. Illisible par la page (httpOnly), envoyé
// seulement en HTTPS en ligne, et jamais vers un autre site (SameSite=Lax).
import "server-only";
import { cookies } from "next/headers";
import { getPool } from "@/db";
import { compteDeLaSession } from "./session";

/** En ligne, le préfixe __Host- interdit au cookie de sortir de ce site ou de passer en clair. */
export function nomDuCookie(env: Record<string, string | undefined> = process.env): string {
  return env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" ? "__Host-bestia_session" : "bestia_session";
}

export async function poserCookieSession(jeton: string, expireLe: Date): Promise<void> {
  const enLigne = nomDuCookie().startsWith("__Host-");
  (await cookies()).set(nomDuCookie(), jeton, { httpOnly: true, secure: enLigne, sameSite: "lax", path: "/", expires: expireLe });
}

/** Le compte connecté dans ce navigateur, ou null. */
export async function compteConnecte(): Promise<{ id: number; email: string } | null> {
  const jeton = (await cookies()).get(nomDuCookie())?.value;
  return jeton ? compteDeLaSession(getPool(), jeton) : null;
}
