import { Illustration } from "./Illustration";

/**
 * Les deux formats d'une illustration d'Espèce : en grand sur sa fiche, en vignette dans
 * une liste. L'optimiseur de Next sert à chaque format la taille qu'il affiche.
 */
export const FORMATS_ESPECE = {
  grand: "(max-width: 820px) 100vw, 480px",
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
