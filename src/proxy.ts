// Passe avant certaines pages :
// - les pages de contrôle : sans le mot de passe de contrôle, le navigateur le demande ;
// - les pages du jeu : la session du joueur est prolongée, au plus une fois par jour (US-0119) ;
// - l'inscription et la connexion : un joueur déjà connecté qui les ouvre va droit au jeu (US-0122).
import { NextResponse, type NextRequest } from "next/server";
import { DEMANDE_MOT_DE_PASSE, motDePasseAccepte } from "./controle/acces";
import { nomDuCookie, nomDuTemoin, reglagesDuCookie, reglagesDuTemoin } from "./comptes/cookie-session";
import { compteDeLaSession, prolongerSession } from "./comptes/session";
import { suiteSure } from "./comptes/suite";
import { getPool } from "./db";

export const config = { matcher: ["/controle", "/controle/:path*", "/jeu", "/jeu/:path*", "/inscription", "/connexion"] };

export async function proxy(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  if (chemin.startsWith("/controle")) return protegerControle(request);
  if (chemin === "/inscription" || chemin === "/connexion") return envoyerAuJeuSiConnecte(request);
  return prolongerLaSession(request);
}

/**
 * À l'ouverture seulement (GET), pas pendant un envoi de formulaire : un envoi qui connecte le
 * joueur, comme l'inscription (US-0123), doit pouvoir afficher sa confirmation sur place.
 */
async function envoyerAuJeuSiConnecte(request: NextRequest) {
  if (request.method !== "GET" || request.headers.has("next-action")) return;
  const jeton = request.cookies.get(nomDuCookie())?.value;
  if (!jeton) return;
  try {
    if (!(await compteDeLaSession(getPool(), jeton))) return;
  } catch {
    return; // Sans réponse de la base, la page s'affiche simplement.
  }
  const suite = request.nextUrl.pathname === "/connexion" ? suiteSure(request.nextUrl.searchParams.get("suite")) : "/jeu";
  return NextResponse.redirect(new URL(suite, request.url));
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
