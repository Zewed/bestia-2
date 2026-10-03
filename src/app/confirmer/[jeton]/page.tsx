import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { confirmerAdresse, type ResultatConfirmation } from "@/comptes/confirmation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import { getPool } from "@/db";
import { LIEN_CONFIRMATION_HEURES } from "@/reglages";
import styles from "../../entree.module.css";
import { demanderNouveauLien } from "./actions";
import { NouveauLien } from "./NouveauLien";

// Le jeton est dans l'adresse de la page : il ne doit fuir vers aucun autre site, ni être indexé.
export const metadata: Metadata = { title: "Confirmer votre adresse", referrer: "no-referrer", robots: { index: false, follow: false } };

const TITRES: Record<ResultatConfirmation, string> = {
  confirmee: "Adresse confirmée",
  "deja-confirmee": "Adresse déjà confirmée",
  expire: "Ce lien a expiré",
  inconnu: "Ce lien n'est pas valable",
};

/**
 * La page qu'ouvre le lien de l'e-mail de confirmation (US-0114). Ouvrir le lien suffit à
 * confirmer l'adresse ; un lien expiré propose d'en recevoir un nouveau.
 */
export default async function ConfirmerAdresse({ params }: { params: Promise<{ jeton: string }> }) {
  await connection();
  if (!entreeDuJeuOuverte()) notFound();
  const { jeton } = await params;
  const resultat = await confirmerAdresse(getPool(), jeton);

  return (
    <PageEntree
      titre={TITRES[resultat]}
      illustration={{ chemin: "entree/inscription.webp", alt: "Un sac d'aventurier ouvert sur un rocher, au-dessus d'une vallée sauvage au lever du soleil" }}
    >
      {resultat === "expire" ? (
        <>
          <p className={styles.texte}>
            Un lien reste valable {LIEN_CONFIRMATION_HEURES} heures. Demandez-en un nouveau : il partira à la même adresse.
          </p>
          <NouveauLien demander={demanderNouveauLien.bind(null, jeton)} />
        </>
      ) : resultat === "inconnu" ? (
        <p className={styles.texte}>Vérifiez qu&apos;il est complet, ou ouvrez le dernier e-mail de Bestia que vous avez reçu.</p>
      ) : (
        <div className={styles.confirmation}>
          <span className={styles.coche} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M5 12.5 10 17.5 19 7" />
            </svg>
          </span>
          <Link href="/connexion" className={styles.envoyer}>
            Se connecter
          </Link>
        </div>
      )}
    </PageEntree>
  );
}
