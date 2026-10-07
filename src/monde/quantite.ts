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
