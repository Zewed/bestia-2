// La connexion d'où vient une inscription (US-0112), pour freiner les inscriptions en rafale.
// L'adresse réseau n'est jamais gardée telle quelle : seule son empreinte, chiffrée avec un
// secret (EMPREINTE_RESEAU_SECRET), l'est, et une heure seulement. Côté serveur uniquement.
import "server-only";
import { createHmac } from "node:crypto";
import { MissingEnvError } from "@/env";

/** L'adresse réseau du visiteur. Sur Vercel, x-forwarded-for est posé par la plateforme elle-même. */
export function adresseReseau(entetes: Headers): string {
  return entetes.get("x-forwarded-for")?.split(",")[0]?.trim() || entetes.get("x-real-ip")?.trim() || "inconnue";
}

/** L'empreinte d'une adresse réseau : impossible d'en retrouver l'adresse sans le secret. */
export function empreinteReseau(adresse: string, secret = process.env.EMPREINTE_RESEAU_SECRET?.trim()): string {
  if (!secret) throw new MissingEnvError(["EMPREINTE_RESEAU_SECRET"]);
  return createHmac("sha256", secret).update(adresse).digest("hex");
}
