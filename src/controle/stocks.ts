// US-0208 : ajuster les Stocks d'un joueur depuis la page de contrôle, pour tester sans attendre.

/** En production, les Stocks se consultent mais ne se modifient pas (décidé le 2026-10-07). */
export function stocksModifiables(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== "production";
}

/**
 * La quantité saisie, en texte pour la base (« 1234.5 »), ou null si ce n'est pas un nombre positif.
 * La virgule ou le point marquent les décimales ; les espaces des milliers sont ignorées.
 */
export function lireQuantite(saisie: string): string | null {
  const nombre = saisie.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d{1,18}(\.\d+)?$/.test(nombre)) return null;
  return nombre;
}
