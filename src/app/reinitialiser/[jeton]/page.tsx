import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { lienValable } from "@/comptes/reinitialisation";
import { PageEntree } from "@/components/PageEntree";
import { getPool } from "@/db";
import styles from "../../entree.module.css";
import { choisirMotDePasse } from "./actions";
import { LIEN_PERIME } from "./etat";
import { FormulaireNouveauMotDePasse } from "./FormulaireNouveauMotDePasse";

// Le jeton est dans l'adresse de la page : il ne doit fuir vers aucun autre site, ni être indexé.
export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer", robots: { index: false, follow: false } };

/**
 * La page qu'ouvre le bouton de l'e-mail « Mot de passe oublié » (US-0128). L'ouvrir ne consomme
 * pas le lien : seul le changement de mot de passe le fait.
 */
export default async function NouveauMotDePasse({ params }: { params: Promise<{ jeton: string }> }) {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { jeton } = await params;
  const lien = await lienValable(getPool(), jeton);
  return (
    <PageEntree
      titre="Nouveau mot de passe"
      illustration={{ chemin: "entree/connexion.webp", alt: "Une hutte au toit de chaume, éclairée au crépuscule, au bout d'un chemin fleuri" }}
    >
      {lien ? (
        <FormulaireNouveauMotDePasse email={lien.email} choisir={choisirMotDePasse.bind(null, jeton)} />
      ) : (
        <div className={styles.confirmation}>
          <p className={styles.texte}>{LIEN_PERIME}</p>
          <Link href="/mot-de-passe-oublie" className={styles.envoyer}>
            Recevoir un nouveau lien
          </Link>
        </div>
      )}
    </PageEntree>
  );
}
