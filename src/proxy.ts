// Passe avant les pages de contrôle : sans le mot de passe de contrôle, le navigateur le demande.
import type { NextRequest } from "next/server";
import { DEMANDE_MOT_DE_PASSE, motDePasseAccepte } from "./controle/acces";

export const config = { matcher: ["/controle", "/controle/:path*"] };

export function proxy(request: NextRequest) {
  if (motDePasseAccepte(request.headers.get("authorization"))) return;
  return new Response("Mot de passe de contrôle requis.", {
    status: 401,
    headers: { "WWW-Authenticate": DEMANDE_MOT_DE_PASSE, "Cache-Control": "no-store" },
  });
}
