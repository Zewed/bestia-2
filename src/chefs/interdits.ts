// Les noms de chef interdits (US-0138) : la comparaison avec la liste des mots interdits, gardée
// en base. Les contournements sont défaits avant de comparer : majuscules, accents, espaces et
// signes glissés (« C-o-n-n-a-r-d »), chiffres à la place des lettres (« C0nnard »), lettres
// répétées (« Connnnard »).
import { cleDuNom, nettoyerNom } from "./nom";

export type MotInterdit = { mot: string; entier: boolean };

const CHIFFRES_LUS: Record<string, string[]> = { "0": ["o"], "1": ["i", "l"], "3": ["e"], "4": ["a"], "5": ["s"], "7": ["t"] };

/** Les lectures possibles d'une forme de comparaison : telle quelle, et chiffres lus comme des lettres. */
function lectures(cle: string): string[] {
  let resultats = [""];
  for (const caractere of cle) {
    const possibles = CHIFFRES_LUS[caractere] ?? [caractere];
    resultats = resultats.flatMap((debut) => possibles.map((suite) => debut + suite));
    if (resultats.length > 64) resultats = resultats.slice(0, 64); // un nom fait de « 1 » n'explose pas
  }
  return cle === resultats[0] ? resultats : [cle, ...resultats];
}

/**
 * Le motif d'un mot interdit : chaque lettre peut être répétée davantage, jamais moins. « connard »
 * attrape « connnnard », mais pas « conard » ; un mot à lettre double ne se réduit jamais à un mot
 * courant, ni « kkk » à un simple « k ».
 */
function motif(mot: string, seul: boolean): RegExp {
  const lettres = (mot.match(/(.)\1*/g) ?? []).map((suite) => `${suite[0]}{${suite.length},}`).join("");
  return new RegExp(seul ? `^${lettres}$` : lettres);
}

/** Si le nom contient un mot interdit, d'une façon ou d'une autre. */
export function nomInterditPar(nom: string, mots: MotInterdit[]): boolean {
  const entier = lectures(cleDuNom(nom));
  // Les mots du nom, un par un (« Le Con ») ; le nom entier compte aussi comme un mot (« C-o-n »).
  const morceaux = [...nettoyerNom(nom).split(/[ '-]+/).flatMap((morceau) => lectures(cleDuNom(morceau))), ...entier];
  return mots.some(({ mot, entier: seul }) => {
    const recherche = motif(mot, seul);
    return (seul ? morceaux : entier).some((lecture) => recherche.test(lecture));
  });
}
