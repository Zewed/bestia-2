// L'empreinte d'un mot de passe (US-0107) : le mot de passe n'est jamais enregistré, seule son
// empreinte scrypt l'est, avec un sel propre à chaque compte. Côté serveur uniquement.
import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/** Les réglages recommandés par l'OWASP pour scrypt : N = 2^17, r = 8, p = 1 (128 Mo, quelques centaines de ms). */
const REGLAGES = { N: 2 ** 17, r: 8, p: 1 };
const LONGUEUR_CLE = 64;
const LONGUEUR_SEL = 16;
/** La mémoire permise au calcul : 128 × N × r, plus une marge. */
const MEMOIRE_MAX = 256 * 1024 * 1024;

function deriver(motDePasse: string, sel: Buffer, longueur: number, reglages: ScryptOptions): Promise<Buffer> {
  return new Promise((ok, refus) =>
    // Les formes Unicode équivalentes d'un même caractère donnent la même empreinte.
    scrypt(motDePasse.normalize("NFKC"), sel, longueur, { ...reglages, maxmem: MEMOIRE_MAX }, (erreur, cle) =>
      erreur ? refus(erreur) : ok(cle),
    ),
  );
}

/** Calcule l'empreinte à enregistrer : « scrypt$N$r$p$sel$clé », pour pouvoir changer les réglages plus tard. */
export async function calculerEmpreinte(motDePasse: string): Promise<string> {
  const sel = randomBytes(LONGUEUR_SEL);
  const cle = await deriver(motDePasse, sel, LONGUEUR_CLE, REGLAGES);
  return ["scrypt", REGLAGES.N, REGLAGES.r, REGLAGES.p, sel.toString("base64"), cle.toString("base64")].join("$");
}

/** Vrai si le mot de passe correspond à l'empreinte. La comparaison prend le même temps dans tous les cas. */
export async function verifierEmpreinte(motDePasse: string, empreinte: string): Promise<boolean> {
  const [algorithme, n, r, p, sel, cle] = empreinte.split("$");
  if (algorithme !== "scrypt" || !sel || !cle) return false;
  const attendue = Buffer.from(cle, "base64");
  const calculee = await deriver(motDePasse, Buffer.from(sel, "base64"), attendue.length, { N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(calculee, attendue);
}
