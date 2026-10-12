import { Nunito } from "next/font/google";

// La police du jeu, hébergée par Next avec lui, la police de secours réglée aux mêmes dimensions : rien ne saute à
// l'affichage. Le sous-ensemble « latin » couvre les caractères du jeu (é, è, ê, à, ç, œ, É…).

/** Une police ronde et franche, lisible petite, claire en gras pour les titres et les nombres. */
export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});
