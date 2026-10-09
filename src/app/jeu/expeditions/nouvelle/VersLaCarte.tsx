"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { versLaCarte } from "@/expeditions/choix-de-destination";

/**
 * US-0907 : le lien de l'écran d'Expédition vers la carte, ouverte pour en choisir la destination. Il garde en chemin
 * les autres choix de l'écran, lus dans son adresse telle qu'elle est au moment du toucher : Next.js relie
 * replaceState à useSearchParams, et la carte les rend à l'écran avec la Case touchée.
 */
export function VersLaCarte({ className, children }: { className?: string; children: ReactNode }) {
  const recherche = useSearchParams();
  return (
    <Link href={versLaCarte(recherche.toString())} className={className}>
      {children}
    </Link>
  );
}
