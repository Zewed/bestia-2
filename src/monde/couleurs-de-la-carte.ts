// Les couleurs des cartes du Monde (US-0412, US-0418), les mêmes sur la page de contrôle et dans le jeu, et sur la
// légende de la carte du jeu (US-0432) : des noms de la palette, que la page comprend telles quelles.

/**
 * US-0437 : la teinte d'une Case sous le brouillard du joueur, à la place de son Biome : le serveur ne dit rien de plus
 * d'elle (src/monde/carte.ts), et la carte la dessine d'une brume unie.
 */
export const BROUILLARD = "brouillard";

/**
 * La couleur de chaque Biome et de chaque eau, prise dans la palette ; une teinte inconnue reste en gris galet.
 * US-0437 : le brouillard, d'un gris neutre qui ne se confond avec aucune d'elles, ni avec le fond au-delà du Monde.
 */
export const COULEURS: Record<string, string> = {
  prairie: "var(--biome-prairie)",
  foret: "var(--biome-foret)",
  jungle: "var(--biome-jungle)",
  savane: "var(--biome-savane)",
  desert: "var(--biome-desert)",
  montagne: "var(--biome-montagne)",
  toundra: "var(--biome-toundra)",
  banquise: "var(--biome-banquise)",
  eau: "var(--biome-eau)",
  mer: "var(--biome-eau)",
  cote: "var(--ardoise)",
  lac: "var(--sarcelle-fonce)",
  riviere: "var(--ciel-fonce)",
  [BROUILLARD]: "var(--sur-encre-pale)",
};
export const couleur = (teinte: string) => COULEURS[teinte] ?? "var(--galet)";
