import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { entreeDuJeuOuverte } from "@/comptes/ouverture";
import { PageEntree } from "@/components/PageEntree";
import styles from "../entree.module.css";
import { inscrire } from "./actions";

export const metadata: Metadata = { title: "Créer un compte" };

/** L'inscription : une adresse e-mail et un mot de passe, rien d'autre. Fermée en production tant que l'entrée du jeu l'est. */
export default function Inscription() {
  if (!entreeDuJeuOuverte()) notFound();
  return (
    <PageEntree
      titre="Créer un compte"
      illustration={{ chemin: "entree/inscription.webp", alt: "Un sac d'aventurier ouvert sur un rocher, au-dessus d'une vallée sauvage au lever du soleil" }}
    >
      {/* Les messages d'erreur sur les champs arrivent avec US-0103 à US-0105 : pas de bulles du navigateur d'ici là. */}
      <form action={inscrire} className={styles.formulaire} noValidate>
        <label className={styles.champ}>
          <span>Adresse e-mail</span>
          <input
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <label className={styles.champ}>
          <span>Mot de passe</span>
          {/* « new-password » : le navigateur propose un mot de passe fort et le retient. */}
          <input type="password" name="motDePasse" autoComplete="new-password" required />
        </label>
        <button type="submit" className={styles.envoyer}>
          Créer mon compte
        </button>
      </form>
      <p className={styles.autre}>
        <Link href="/connexion" className={styles.lien}>
          J&apos;ai déjà un compte
        </Link>
      </p>
    </PageEntree>
  );
}
