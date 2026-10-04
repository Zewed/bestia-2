// Le chemin où emmener un joueur après sa connexion (US-0121). Il voyage dans l'adresse de la
// page de connexion : on n'accepte qu'un chemin du jeu, jamais un autre site. Pas de
// « server-only » : le navigateur et le serveur s'en servent.

const ACCUEIL_DU_JEU = "/jeu";

/** Le chemin demandé s'il mène à une page du jeu, sinon l'accueil du jeu. */
export function suiteSure(valeur: string | null | undefined): string {
  if (!valeur || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.includes("\\")) return ACCUEIL_DU_JEU;
  try {
    const base = "https://bestia.invalid";
    const url = new URL(valeur, base);
    if (url.origin !== base) return ACCUEIL_DU_JEU;
    if (url.pathname !== ACCUEIL_DU_JEU && !url.pathname.startsWith(`${ACCUEIL_DU_JEU}/`)) return ACCUEIL_DU_JEU;
    return url.pathname + url.search;
  } catch {
    return ACCUEIL_DU_JEU;
  }
}

/**
 * L'adresse de la connexion qui ramènera ensuite au chemin demandé ; « expiree » y fait dire
 * que la session a expiré (US-0125).
 */
export function connexionPuis(chemin: string, { expiree = false }: { expiree?: boolean } = {}): string {
  const suite = suiteSure(chemin);
  const parametres = new URLSearchParams();
  if (suite !== ACCUEIL_DU_JEU) parametres.set("suite", suite);
  if (expiree) parametres.set("expiree", "1");
  const requete = parametres.toString();
  return requete ? `/connexion?${requete}` : "/connexion";
}
