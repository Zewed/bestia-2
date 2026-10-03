import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { suiteSure } from "@/comptes/suite";
import { PageEntree } from "@/components/PageEntree";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Se connecter" };

/**
 * La connexion (US-0115) : l'adresse et le mot de passe. « suite » dit où emmener le joueur une
 * fois connecté (US-0121). Fermée en production tant que l'entrée du jeu l'est.
 */
export default async function Connexion({ searchParams }: { searchParams: Promise<{ suite?: string | string[] }> }) {
  if (!entreeDuJeuOuverte()) notFound();
  const { suite } = await searchParams;
  return (
    <PageEntree
      titre="Se connecter"
      illustration={{ chemin: "entree/connexion.webp", alt: "Une hutte au toit de chaume, éclairée au crépuscule, au bout d'un chemin fleuri" }}
    >
      <FormulaireConnexion suite={suiteSure(typeof suite === "string" ? suite : null)} />
    </PageEntree>
  );
}
