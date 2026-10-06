// Les règles du nom de chef (US-0132 à US-0135), les mêmes dans le navigateur et sur le serveur.
import { NOM_DE_CHEF_MAX, NOM_DE_CHEF_MIN } from "@/reglages";

export const NOM_TROP_COURT = `${NOM_DE_CHEF_MIN} caractères minimum`;
export const NOM_TROP_LONG = `${NOM_DE_CHEF_MAX} caractères maximum`;
export const CARACTERE_INVISIBLE = "Caractère invisible non autorisé";
export const COMMENCER_PAR_UNE_LETTRE = "Commencez par une lettre";
export const DEUX_SIGNES_A_LA_SUITE = "Pas deux signes à la suite";
export const caractereRefuse = (caractere: string) => `« ${caractere} » n'est pas autorisé`;
export const NOM_DEJA_PRIS = "Ce nom est déjà pris";
/** US-0137 : pris entre la coche « disponible » et la validation. */
export const NOM_VIENT_D_ETRE_PRIS = "Ce nom vient d'être pris";
/** US-0138 : un nom injurieux ou qui se fait passer pour l'équipe du jeu, sans citer le mot. */
export const NOM_NON_AUTORISE = "Ce nom n'est pas autorisé";
/** US-0153, US-0159 : le Monde n'a plus de place pour un nouveau Foyer ; rien n'est enregistré. */
export const mondeComplet = (monde: string) => `${monde} est complet. Un nouveau Monde ouvre bientôt.`;

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

/**
 * La saisie mise au propre, sans rien changer à ce qu'on voit : les apostrophes courbes des
 * téléphones deviennent droites, les traits d'union et espaces spéciaux deviennent ordinaires, et
 * un accent écrit en deux morceaux n'en fait plus qu'un.
 */
export function preparerNom(saisie: string): string {
  return saisie.replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u2010\u2011]/g, "-").replace(/\p{Zs}/gu, " ").normalize("NFC");
}

/**
 * La saisie pendant la frappe (US-0134) : mise au propre, sans espace en tête ni deux espaces de
 * suite. L'espace de fin reste, le temps de taper le mot suivant.
 */
export function nettoyerSaisie(saisie: string): string {
  return preparerNom(saisie).replace(/^ +/, "").replace(/ {2,}/g, " ");
}

/** Le nom tel qu'il sera enregistré : nettoyé, sans espace au début ni à la fin (US-0134). */
export function nettoyerNom(saisie: string): string {
  return nettoyerSaisie(saisie).trimEnd();
}

// L'alphabet latin et ses accents (é, ç, œ, ß, ș…), sans les lettres qui en imitent d'autres
// (ſ, ŉ) ; les autres alphabets permettraient de se faire passer pour un autre chef (« О » cyrillique).
const LETTRE = /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u0148\u014A-\u017E\u0218-\u021B]$/;
const SIGNE = /^[ '-]$/;
const INVISIBLE = /^[\p{M}\p{Cf}\p{Cc}\p{Co}\p{Cs}\p{Cn}\u115F\u1160\u3164\uFFA0\u2800]+$|[\p{Cf}\p{Cc}](?!.*\p{Extended_Pictographic})/u;
const VISIBLE_SEUL = /\p{Extended_Pictographic}/u;

/** Le message qui refuse un caractère du nom, ou null s'ils sont tous permis (US-0133). */
export function verifierCaracteresDuNom(nom: string): string | null {
  const liste = caracteres(preparerNom(nom).trim());
  for (const caractere of liste) {
    if (!VISIBLE_SEUL.test(caractere) && INVISIBLE.test(caractere)) return CARACTERE_INVISIBLE;
    if (!LETTRE.test(caractere) && !/^[0-9]$/.test(caractere) && !SIGNE.test(caractere)) return caractereRefuse(caractere);
  }
  if (liste.length > 0 && !LETTRE.test(liste[0])) return COMMENCER_PAR_UNE_LETTRE;
  // Deux espaces de suite seront réduits à un seul (US-0134) ; un tiret ou une apostrophe ne se double pas.
  for (let i = 1; i < liste.length; i++) {
    if (SIGNE.test(liste[i - 1]) && SIGNE.test(liste[i]) && !(liste[i - 1] === " " && liste[i] === " ")) return DEUX_SIGNES_A_LA_SUITE;
  }
  return null;
}

/**
 * Toutes les règles du nom, dans l'ordre où le joueur les rencontre. À l'enregistrement, le
 * serveur nettoie la saisie (nettoyerNom) puis les refait : un nom fait d'espaces devient vide,
 * et se voit refuser comme trop court.
 */
export function verifierNomDeChef(nom: string): string | null {
  return verifierCaracteresDuNom(nom) ?? verifierLongueurDuNom(nom);
}

// Les lettres latines qu'aucune décomposition ne ramène à une lettre simple.
const LETTRES_A_PLAT: Record<string, string> = { ß: "ss", æ: "ae", œ: "oe", ø: "o", ð: "d", đ: "d", þ: "th", ħ: "h", ı: "i", ĸ: "k", ł: "l", ŋ: "n", ŧ: "t" };

/**
 * La forme sous laquelle deux noms se comparent (US-0135) : en minuscules, sans accents ni
 * espaces, traits d'union ou apostrophes. « Élan », « elan » et « É-lan » sont le même nom, comme
 * « Cœur » et « Coeur » : personne ne peut porter presque le nom d'un autre chef.
 */
export function cleDuNom(nom: string): string {
  return nettoyerNom(nom)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ßæœøðđþħıĸłŋŧ]/g, (lettre) => LETTRES_A_PLAT[lettre])
    .replace(/[^a-z0-9]/g, "");
}

