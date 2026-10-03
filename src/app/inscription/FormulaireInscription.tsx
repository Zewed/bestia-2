"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { retenirAdresse } from "@/comptes/adresse-retenue";
import { EMAIL_DEJA_UTILISEE, normaliserEmail, verifierEmail } from "@/comptes/email";
import { REGLE_MOT_DE_PASSE, verifierMotDePasse } from "@/comptes/mot-de-passe";
import { MOT_DE_PASSE_MAX, MOT_DE_PASSE_MIN } from "@/reglages";
import styles from "../entree.module.css";
import { inscrire } from "./actions";
import { ETAT_INITIAL, type EtatInscription } from "./etat";

/**
 * Le formulaire d'inscription. Le message sous un champ apparaît quand on quitte le champ ou
 * à l'envoi, jamais pendant la frappe ; il s'efface dès qu'on recommence à écrire. Une fois le
 * compte créé, la confirmation prend la place du formulaire (US-0108).
 */
export function FormulaireInscription() {
  const [etat, envoyer] = useActionState(inscrire, ETAT_INITIAL);
  if (etat.cree) return <CompteCree email={normaliserEmail(etat.email)} />;
  return <Formulaire etat={etat} envoyer={envoyer} />;
}

function Formulaire({ etat, envoyer }: { etat: EtatInscription; envoyer: (donnees: FormData) => void }) {
  const [email, setEmail] = useState("");
  const [erreurEmail, setErreurEmail] = useState<string | null>(null);
  const [erreurMotDePasse, setErreurMotDePasse] = useState<string | null>(null);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
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
    // À l'envoi, le mot de passe repasse masqué : les gestionnaires de mots de passe le reconnaissent mieux.
    if (!messageEmail && !messageMotDePasse) return setMotDePasseVisible(false);
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
            {/* US-0109 : l'adresse a déjà un compte, on y va avec elle. */}
            {erreurE === EMAIL_DEJA_UTILISEE ? (
              <>
                {" · "}
                <Link href="/connexion" className={styles.lienErreur} onClick={() => retenirAdresse(normaliserEmail(email))}>
                  Se connecter
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className={styles.champ}>
        <label htmlFor="mot-de-passe">Mot de passe</label>
        {/* « new-password » et les longueurs : le navigateur propose un mot de passe fort qui respecte la règle. */}
        <div className={styles.saisie}>
          <input
            ref={champMotDePasse}
            id="mot-de-passe"
            type={motDePasseVisible ? "text" : "password"}
            name="motDePasse"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
          <button
            type="button"
            className={styles.oeil}
            onClick={() => setMotDePasseVisible((visible) => !visible)}
            aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-controls="mot-de-passe"
          >
            <Oeil barre={motDePasseVisible} />
          </button>
        </div>
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
      <p className={styles.autre}>
        <Link href="/connexion" className={styles.lien}>
          J&apos;ai déjà un compte
        </Link>
      </p>
    </form>
  );
}

/**
 * La confirmation : le compte existe, on peut se connecter. L'adresse est retenue dans la
 * mémoire de l'onglet pour pré-remplir la connexion ; le mot de passe a disparu avec le formulaire.
 */
function CompteCree({ email }: { email: string }) {
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    retenirAdresse(email);
    // Le regard (et le lecteur d'écran) va droit à la confirmation.
    message.current?.focus();
  }, [email]);
  return (
    <div className={styles.confirmation} role="status">
      <span className={styles.coche} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      </span>
      <p ref={message} tabIndex={-1} className={styles.confirme}>
        Votre compte est créé
      </p>
      <p className={styles.adresse}>{email}</p>
      <Link href="/connexion" className={styles.envoyer}>
        Se connecter
      </Link>
    </div>
  );
}

/** L'œil du champ mot de passe : ouvert pour afficher, barré pour masquer. */
function Oeil({ barre }: { barre: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {barre ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}
