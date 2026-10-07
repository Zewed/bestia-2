"use client";

import { useEffect } from "react";
import { noterMaPresence } from "@/app/jeu/actions";

/**
 * US-0216 : note la présence du joueur dès que la barre du haut s'affiche, puis à chaque recalage
 * (la barre repart alors de zéro, US-0213) : une page du jeu ouverte compte comme une présence.
 */
export function Presence() {
  useEffect(() => {
    void noterMaPresence();
  }, []);
  return null;
}
