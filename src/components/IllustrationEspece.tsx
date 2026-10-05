import { Illustration } from "./Illustration";

/**
 * Les formats d'une illustration d'Espèce : en grand sur sa fiche, en carte sur le choix du Couple
 * de départ, en vignette dans une liste. L'optimiseur de Next sert à chaque format la taille qu'il affiche.
 */
export const FORMATS_ESPECE = {
  grand: "(max-width: 820px) 100vw, 480px",
  /** Une carte parmi trois côte à côte, en vignette sur mobile (US-0141). */
  carte: "(max-width: 820px) 112px, 380px",
  vignette: "96px",
} as const;

type IllustrationEspeceProps = {
  espece: { nom: string; illustration: string | null };
  format: keyof typeof FORMATS_ESPECE;
  className?: string;
};

/** Le portrait carré d'une Espèce ; sans illustration, la tête de loup le remplace. */
export function IllustrationEspece({ espece, format, className }: IllustrationEspeceProps) {
  return <Illustration chemin={espece.illustration} alt={espece.nom} ratio="1 / 1" sizes={FORMATS_ESPECE[format]} className={className} />;
}
