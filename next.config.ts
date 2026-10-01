import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Le format le plus léger que le navigateur accepte.
    formats: ["image/avif", "image/webp"],
    // Seules les illustrations du jeu passent par l'optimiseur, sans paramètres d'adresse.
    localPatterns: [{ pathname: "/illustrations/**", search: "" }],
  },
};

export default nextConfig;
