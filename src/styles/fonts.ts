import { Plus_Jakarta_Sans } from "next/font/google";

// La police du prototype, pour les titres comme pour les textes. Next l'héberge avec le
// jeu et règle la police de secours aux mêmes dimensions : rien ne saute à l'affichage.
// Le sous-ensemble « latin » couvre les caractères du jeu (é, è, ê, à, ç, œ, É…).
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
