// Les règles du scan de secrets, séparées du script pour être testées.
// Un résultat nomme la règle, jamais la valeur trouvée.

export const SECRET_RULES: { name: string; pattern: RegExp }[] = [
  {
    name: "adresse Postgres avec mot de passe",
    pattern: /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@(?!(?:localhost|127\.0\.0\.1)[:/])/,
  },
  { name: "mot de passe Neon", pattern: /npg_[A-Za-z0-9]{8,}/ },
  { name: "jeton JWT", pattern: /eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/ },
  { name: "clé privée", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "jeton GitHub", pattern: /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_\w{30,}/ },
  { name: "clé AWS", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "clé d'API", pattern: /\bsk-[A-Za-z0-9_-]{20,}/ },
];

// Fichiers qui ne doivent jamais être suivis, quel que soit leur contenu.
const FORBIDDEN_FILES = [/(^|\/)\.env(?!\.example$)[^/]*$/, /^\.vercel\//];

export type SecretFinding = { line: number; rule: string };

export function findSecrets(text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  text.split("\n").forEach((line, index) => {
    for (const rule of SECRET_RULES) {
      if (rule.pattern.test(line)) findings.push({ line: index + 1, rule: rule.name });
    }
  });
  return findings;
}

export function isForbiddenFile(path: string): boolean {
  return FORBIDDEN_FILES.some((pattern) => pattern.test(path));
}

/** Les lignes de .env.example qui renseignent une valeur, alors qu'elles doivent rester vides. */
export function filledExampleLines(text: string): number[] {
  const lines: number[] = [];
  text.split("\n").forEach((line, index) => {
    if (/^\s*[A-Z0-9_]+\s*=\s*\S/.test(line)) lines.push(index + 1);
  });
  return lines;
}
