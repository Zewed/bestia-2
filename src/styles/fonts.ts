import { Lilita_One, Nunito } from "next/font/google";

// Les deux polices du jeu, hébergées par Next avec lui, la police de secours réglée aux mêmes dimensions : rien ne
// saute à l'affichage. Le sous-ensemble « latin » couvre les caractères du jeu (é, è, ê, à, ç, œ, É…).

/** Le texte : une police ronde et franche, lisible petite, comme celle des jeux sur téléphone. */
export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

/** Les titres, les nombres du jeu et les boutons : des lettres grasses et rondes, taillées comme des jetons. */
export const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lilita",
  display: "swap",
});
