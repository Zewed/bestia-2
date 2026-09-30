// Les variables d'environnement dont le jeu a besoin. Chacune doit aussi figurer,
// sans valeur, dans .env.example.
const REQUIRED = ["DATABASE_URL"] as const;

export type RequiredEnvVar = (typeof REQUIRED)[number];

export class MissingEnvError extends Error {
  constructor(readonly missing: readonly string[]) {
    const plural = missing.length > 1 ? "s" : "";
    super(
      `Variable${plural} d'environnement manquante${plural} : ${missing.join(", ")}. ` +
        "Lancez vercel env pull .env.local, ou copiez .env.example vers .env.local et remplissez-le.",
    );
    this.name = "MissingEnvError";
  }
}

function isMissing(name: string): boolean {
  return !process.env[name]?.trim();
}

/** Vérifie d'un coup toutes les variables obligatoires, et nomme celles qui manquent. */
export function assertEnv(): void {
  const missing = REQUIRED.filter(isMissing);
  if (missing.length > 0) throw new MissingEnvError(missing);
}

/** Lit une variable obligatoire ; son absence produit un message qui la nomme. */
export function env(name: RequiredEnvVar): string {
  if (isMissing(name)) throw new MissingEnvError([name]);
  return process.env[name]!.trim();
}
