"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { verifierEmail } from "@/comptes/email";
import { REGLE_MOT_DE_PASSE, verifierMotDePasse } from "@/comptes/mot-de-passe";
import { MOT_DE_PASSE_MAX, MOT_DE_PASSE_MIN } from "@/reglages";
import styles from "../entree.module.css";
import { inscrire } from "./actions";
import { ETAT_INITIAL } from "./etat";

/**
 * Le formulaire d'inscription. Le message sous un champ apparaît quand on quitte le champ ou
 * à l'envoi, jamais pendant la frappe ; il s'efface dès qu'on recommence à écrire.
 */
export function FormulaireInscription() {
  const [etat, envoyer] = useActionState(inscrire, ETAT_INITIAL);
  const [email, setEmail] = useState("");
  const [erreurEmail, setErreurEmail] = useState<string | null>(null);
  const [erreurMotDePasse, setErreurMotDePasse] = useState<string | null>(null);
  // Le dernier envoi dont on a recommencé à corriger le mot de passe : son refus ne s'affiche plus.
  const [envoiCorrige, setEnvoiCorrige] = useState(ETAT_INITIAL);
  const champEmail = useRef<HTMLInputElement>(null);
  const champMotDePasse = useRef<HTMLInputElement>(null);

  // Un refus du serveur reste affiché tant que le champ n'a pas changé depuis l'envoi.
  const erreurE = erreurEmail ?? (etat.erreurs.email && etat.email === email ? etat.erreurs.email : null);
  const erreurM = erreurMotDePasse ?? (etat !== envoiCorrige ? (etat.erreurs.motDePasse ?? null) : null);

  function verifierAvantEnvoi(evenement: FormEvent<HTMLFormElement>) {
    const messageEmail = verifierEmail(email);
    const messageMotDePasse = verifierMotDePasse(String(new FormData(evenement.currentTarget).get("motDePasse") ?? ""));
    if (!messageEmail && !messageMotDePasse) return;
    evenement.preventDefault();
    setErreurEmail(messageEmail);
    setErreurMotDePasse(messageMotDePasse);
    (messageEmail ? champEmail : champMotDePasse).current?.focus();
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
          aria-invalid={erreurE ? true : undefined}
          aria-describedby={erreurE ? "email-erreur" : undefined}
        />
        {erreurE ? (
          <p id="email-erreur" className={styles.erreur} role="alert">
            {erreurE}
          </p>
        ) : null}
      </div>
      <div className={styles.champ}>
        <label htmlFor="mot-de-passe">Mot de passe</label>
        {/* « new-password » et les longueurs : le navigateur propose un mot de passe fort qui respecte la règle. */}
        <input
          ref={champMotDePasse}
          id="mot-de-passe"
          type="password"
          name="motDePasse"
          autoComplete="new-password"
          minLength={MOT_DE_PASSE_MIN}
          {...{ passwordrules: `minlength: ${MOT_DE_PASSE_MIN}; maxlength: ${MOT_DE_PASSE_MAX};` }}
          required
          onChange={() => {
            setErreurMotDePasse(null);
            setEnvoiCorrige(etat);
          }}
          onBlur={(e) => setErreurMotDePasse(verifierMotDePasse(e.currentTarget.value))}
          aria-invalid={erreurM ? true : undefined}
          aria-describedby="mot-de-passe-aide"
        />
        {/* La règle est écrite avant qu'on se trompe ; en cas d'erreur, le message prend sa place. */}
        {erreurM ? (
          <p id="mot-de-passe-aide" className={styles.erreur} role="alert">
            {erreurM}
          </p>
        ) : (
          <p id="mot-de-passe-aide" className={styles.aide}>
            {REGLE_MOT_DE_PASSE}
          </p>
        )}
      </div>
      <button type="submit" className={styles.envoyer}>
        Créer mon compte
      </button>
    </form>
  );
}
