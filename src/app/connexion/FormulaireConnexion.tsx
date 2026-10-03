"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lireAdresseRetenue } from "@/comptes/adresse-retenue";
import { ChampMotDePasse } from "../ChampMotDePasse";
import styles from "../entree.module.css";
import { seConnecter } from "./actions";

/**
 * Le formulaire de connexion (US-0115) : l'adresse et le mot de passe, que le navigateur peut
 * remplir avec ce qu'il a enregistré. En arrivant de l'inscription, l'adresse est déjà là (US-0108).
 */
export function FormulaireConnexion() {
  const [email, setEmail] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  // L'adresse retenue vit dans la mémoire de l'onglet : on ne peut la lire qu'une fois dans le navigateur.
  useEffect(() => {
    const retenue = lireAdresseRetenue();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'un état extérieur (sessionStorage)
    if (retenue) setEmail((saisie) => saisie || retenue);
  }, []);

  return (
    <form action={seConnecter} className={styles.formulaire}>
      <div className={styles.champ}>
        <label htmlFor="email">Adresse e-mail</label>
        {/* « username » : le navigateur y reconnaît l'identifiant à associer au mot de passe enregistré. */}
        <input
          id="email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className={styles.champ}>
        <label htmlFor="mot-de-passe">Mot de passe</label>
        <ChampMotDePasse
          id="mot-de-passe"
          name="motDePasse"
          autoComplete="current-password"
          required
          visible={motDePasseVisible}
          basculer={() => setMotDePasseVisible((visible) => !visible)}
        />
      </div>
      <button type="submit" className={styles.envoyer}>
        Se connecter
      </button>
      <p className={styles.autre}>
        <Link href="/inscription" className={styles.lien}>
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
