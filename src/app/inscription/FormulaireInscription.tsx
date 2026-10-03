"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { verifierEmail } from "@/comptes/email";
import styles from "../entree.module.css";
import { inscrire } from "./actions";
import { ETAT_INITIAL } from "./etat";

/**
 * Le formulaire d'inscription. Le message sous le champ e-mail apparaît quand on quitte le
 * champ ou à l'envoi, jamais pendant la frappe ; il s'efface dès qu'on recommence à écrire.
 */
export function FormulaireInscription() {
  const [etat, envoyer] = useActionState(inscrire, ETAT_INITIAL);
  const [email, setEmail] = useState("");
  const [erreurEmail, setErreurEmail] = useState<string | null>(null);
  const champEmail = useRef<HTMLInputElement>(null);
  // Le refus du serveur reste affiché tant que l'adresse n'a pas changé depuis l'envoi.
  const refusServeur = etat.erreurs.email && etat.email === email ? etat.erreurs.email : null;
  const erreur = erreurEmail ?? refusServeur;

  function verifierAvantEnvoi(evenement: FormEvent<HTMLFormElement>) {
    const message = verifierEmail(email);
    if (message) {
      evenement.preventDefault();
      setErreurEmail(message);
      champEmail.current?.focus();
    }
  }

  return (
    <form action={envoyer} onSubmit={verifierAvantEnvoi} className={styles.formulaire} noValidate>
      <div className={styles.champ}>
        <label htmlFor="email">Adresse e-mail</label>
        <input
          ref={champEmail}
          id="email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErreurEmail(null);
          }}
          onBlur={() => setErreurEmail(verifierEmail(email))}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? "email-erreur" : undefined}
        />
        {erreur ? (
          <p id="email-erreur" className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
      </div>
      <div className={styles.champ}>
        <label htmlFor="mot-de-passe">Mot de passe</label>
        {/* « new-password » : le navigateur propose un mot de passe fort et le retient. */}
        <input id="mot-de-passe" type="password" name="motDePasse" autoComplete="new-password" required />
      </div>
      <button type="submit" className={styles.envoyer}>
        Créer mon compte
      </button>
    </form>
  );
}
