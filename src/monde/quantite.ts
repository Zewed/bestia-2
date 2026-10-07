import { ABREGER_A_PARTIR_DE } from "@/reglages";

const entiers = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const dixiemes = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
/** L'espace fine que donne le français est presque invisible dans la police du jeu : une espace insécable la remplace. */
const insecable = (texte: string) => texte.replace(/ /g, " ");

/**
 * Une quantité telle que le joueur la lit : un nombre entier, arrondi vers le bas pour ne jamais
 * promettre ce qu'il n'a pas, les milliers séparés par une espace (12 500, US-0203). À partir de
 * ABREGER_A_PARTIR_DE, il s'abrège en milliers puis en millions (US-0206), toujours arrondi vers le
 * bas : une décimale sous 10, aucune au-delà (123 k, 1,2 M, 12 M).
 */
export function quantiteAffichee(quantite: string | number): string {
  const n = Math.floor(Number(quantite));
  if (n < ABREGER_A_PARTIR_DE) return insecable(entiers.format(n));
  const [unite, lettre] = n < 1_000_000 ? [1_000, "k"] : [1_000_000, "M"];
  const enDixiemes = Math.floor(n / (unite / 10));
  const abrege = enDixiemes < 100 ? dixiemes.format(enDixiemes / 10) : entiers.format(Math.floor(n / unite));
  return insecable(`${abrege} ${lettre}`);
}

/**
 * Une quantité exacte, fractions comprises, pour la page de contrôle (US-0208) : la valeur en base,
 * sans les zéros inutiles, à la française (1 234,4).
 */
export function quantiteExacte(quantite: string): string {
  const [entiers, decimales = ""] = quantite.split(".");
  const partieEntiere = insecable(BigInt(entiers).toLocaleString("fr-FR"));
  const fraction = decimales.replace(/0+$/, "");
  return fraction ? `${partieEntiere},${fraction}` : partieEntiere;
}

/** US-0212 : une production horaire, arrondie vers le bas au dixième : « 14,5 ». */
export function productionHoraire(parHeure: string | number): string {
  return insecable(dixiemes.format(Math.floor(Number(parHeure) * 10) / 10));
}

/** US-0212 : la production horaire telle que la barre l'affiche : « +14,5/h ». */
export const productionAffichee = (parHeure: string | number) => `+${productionHoraire(parHeure)}/h`;
