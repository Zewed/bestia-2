// Les règles du nom de chef (US-0132), les mêmes dans le navigateur et sur le serveur.
import { NOM_DE_CHEF_MAX, NOM_DE_CHEF_MIN } from "@/reglages";

export const NOM_TROP_COURT = `${NOM_DE_CHEF_MIN} caractères minimum`;
export const NOM_TROP_LONG = `${NOM_DE_CHEF_MAX} caractères maximum`;

const segmenteur = new Intl.Segmenter("fr", { granularity: "grapheme" });
const caracteres = (texte: string) => [...segmenteur.segment(texte)].map((s) => s.segment);

/** La longueur du nom telle qu'on la voit : « É » compte pour un, les espaces autour ne comptent pas. */
export function longueurDuNom(nom: string): number {
  return caracteres(nom.trim()).length;
}

/** Le message qui refuse la longueur du nom, ou null si elle est bonne. */
export function verifierLongueurDuNom(nom: string): string | null {
  const longueur = longueurDuNom(nom);
  if (longueur < NOM_DE_CHEF_MIN) return NOM_TROP_COURT;
  if (longueur > NOM_DE_CHEF_MAX) return NOM_TROP_LONG;
  return null;
}

/** Le nom coupé à la longueur permise : un collage trop long perd seulement sa fin. */
export function couperNom(nom: string): string {
  let garde = "";
  for (const caractere of caracteres(nom)) {
    if (longueurDuNom(garde + caractere) > NOM_DE_CHEF_MAX) break;
    garde += caractere;
  }
  return garde;
}
