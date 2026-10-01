import type { MetadataRoute } from "next";
import couleurs from "./couleurs-app.json";

// Ajouté à l'écran d'accueil d'un téléphone, le jeu garde son nom et l'icône du loup.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bestia",
    short_name: "Bestia",
    description: "Un monde sauvage, des bêtes à apprivoiser. Faites votre sac : l'aventure vous attend.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: couleurs.encre,
    theme_color: couleurs.encre,
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
