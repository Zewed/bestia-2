// Passe avant certaines pages :
// - les pages de contrôle : sans le mot de passe de contrôle, le navigateur le demande ;
// - les pages du jeu : la session du joueur est prolongée, au plus une fois par jour (US-0119).
import { NextResponse, type NextRequest } from "next/server";
import { DEMANDE_MOT_DE_PASSE, motDePasseAccepte } from "./controle/acces";
import { nomDuCookie, nomDuTemoin, reglagesDuCookie, reglagesDuTemoin } from "./comptes/cookie-session";
import { prolongerSession } from "./comptes/session";
import { getPool } from "./db";

export const config = { matcher: ["/controle", "/controle/:path*", "/jeu", "/jeu/:path*"] };

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/controle")) return protegerControle(request);
  return prolongerLaSession(request);
}

function protegerControle(request: NextRequest) {
  if (motDePasseAccepte(request.headers.get("authorization"))) return;
  return new Response("Mot de passe de contrôle requis.", {
    status: 401,
    headers: { "WWW-Authenticate": DEMANDE_MOT_DE_PASSE, "Cache-Control": "no-store" },
  });
}

async function prolongerLaSession(request: NextRequest) {
  const jeton = request.cookies.get(nomDuCookie())?.value;
  if (!jeton) return;
  try {
    const fin = await prolongerSession(getPool(), jeton);
    if (!fin) return;
    const reponse = NextResponse.next();
    reponse.cookies.set(nomDuCookie(), jeton, reglagesDuCookie(fin));
    reponse.cookies.set(nomDuTemoin(), "1", reglagesDuTemoin(fin));
    return reponse;
  } catch (erreur) {
    // Une prolongation manquée n'empêche pas de jouer : la session court encore.
    console.error(`Session non prolongée : ${erreur instanceof Error ? erreur.message : "erreur inconnue"}.`);
  }
}
