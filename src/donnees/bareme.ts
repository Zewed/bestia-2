// Le barème des caractéristiques (ADR 0007) : une Espèce donne ses mesures réelles, le
// barème en tire sa force, ses Places, sa charge et son Entretien. Une fourmi vaut 1.

export const BAREME = {
  /** vie = 50 × masse en grammes ^ 0,75 : une fourmi (5 mg) vaut 1, une souris (20 g) 473. */
  coefficientVie: 50,
  exposant: 0.75,
  /** La souris occupe une Place ; les Places suivent la même loi que la vie. */
  masseUnePlaceG: 20,
  /** Le venin double le facteur d'arme. */
  venin: 2,
  /** Une Bête porte le quart de sa masse. */
  partPortee: 0.25,
} as const;

export type Mesures = {
  /** La masse réelle, en grammes. */
  masseG: number;
  /** Le facteur d'arme : la dangerosité pour sa taille (1 pour une morsure ordinaire). */
  arme: number;
  venimeux?: boolean;
  /** La Nourriture mangée par jour, en grammes (1 unité de Nourriture = 1 g). */
  nourritureGParJour: number;
};

export type Caracteristiques = { attaque: number; vie: number; taille: number; charge: number; entretienParHeure: number };

const arrondi = (x: number, decimales: number) => Math.round(x * 10 ** decimales) / 10 ** decimales;

export function appliquerBareme(m: Mesures): Caracteristiques {
  const facteur = m.arme * (m.venimeux ? BAREME.venin : 1);
  const vie = Math.max(1, Math.round(BAREME.coefficientVie * m.masseG ** BAREME.exposant));
  const attaque = facteur > 0 ? Math.max(1, Math.round(vie * facteur)) : 0;
  return {
    attaque,
    vie,
    taille: Math.max(0.001, arrondi((m.masseG / BAREME.masseUnePlaceG) ** BAREME.exposant, 3)),
    charge: arrondi(m.masseG * BAREME.partPortee, 1),
    entretienParHeure: arrondi(m.nourritureGParJour / 24, 3),
  };
}
