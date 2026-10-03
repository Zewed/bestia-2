// Les empreintes chiffrées de ce qu'on ne veut pas garder en clair, pour freiner les abus :
// l'adresse réseau d'une inscription (US-0112) et l'adresse e-mail d'un essai de connexion
// (US-0118). Chiffrées avec le secret EMPREINTE_RESEAU_SECRET, elles ne se laissent pas
// retrouver sans lui. Côté serveur uniquement.
import "server-only";
import { createHmac } from "node:crypto";
import { MissingEnvError } from "@/env";

/** L'adresse réseau du visiteur. Sur Vercel, x-forwarded-for est posé par la plateforme elle-même. */
export function adresseReseau(entetes: Headers): string {
  return entetes.get("x-forwarded-for")?.split(",")[0]?.trim() || entetes.get("x-real-ip")?.trim() || "inconnue";
}

function empreinte(espece: string, valeur: string, secret: string | undefined): string {
  if (!secret) throw new MissingEnvError(["EMPREINTE_RESEAU_SECRET"]);
  // L'espèce sépare les deux usages : une adresse réseau et une adresse e-mail ne se confondent jamais.
  return createHmac("sha256", secret).update(`${espece}:${valeur}`).digest("hex");
}

/** L'empreinte d'une adresse réseau : impossible d'en retrouver l'adresse sans le secret. */
export function empreinteReseau(adresse: string, secret = process.env.EMPREINTE_RESEAU_SECRET?.trim()): string {
  return empreinte("reseau", adresse, secret);
}

/** L'empreinte d'une adresse e-mail essayée à la connexion, sous sa forme normale. */
export function empreinteAdresse(emailNormalise: string, secret = process.env.EMPREINTE_RESEAU_SECRET?.trim()): string {
  return empreinte("adresse", emailNormalise, secret);
}
