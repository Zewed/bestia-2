// Refuse tout secret dans ce qui peut partir dans le dépôt.
//   npm run secrets           fichiers suivis et nouveaux fichiers non ignorés
//   npm run secrets:history   tout l'historique Git
// Le message nomme le fichier, la ligne et la règle, jamais la valeur trouvée.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const RULES: { name: string; pattern: RegExp }[] = [
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
const FORBIDDEN_FILES = [/^\.env(?!\.example$)/, /(^|\/)\.env(?!\.example$)[^/]*$/, /^\.vercel\//];

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 512 });
}

function scanText(text: string, where: (line: number) => string, problems: string[]) {
  text.split("\n").forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) problems.push(`${where(index + 1)} : ${rule.name}`);
    }
  });
}

function scanWorkingTree(problems: string[]) {
  const files = git("ls-files", "-z", "--cached", "--others", "--exclude-standard")
    .split("\0")
    .filter(Boolean);
  for (const file of files) {
    if (FORBIDDEN_FILES.some((pattern) => pattern.test(file))) {
      problems.push(`${file} : fichier de secrets qui ne doit pas être dans le dépôt`);
      continue;
    }
    let content: Buffer;
    try {
      content = readFileSync(file);
    } catch {
      continue; // supprimé mais pas encore validé
    }
    if (content.subarray(0, 8000).includes(0)) continue; // fichier binaire
    const text = content.toString("utf8");
    scanText(text, (line) => `${file}:${line}`, problems);
    if (file === ".env.example") {
      text.split("\n").forEach((line, index) => {
        if (/^\s*[A-Z0-9_]+\s*=\s*\S/.test(line)) {
          problems.push(`.env.example:${index + 1} : une valeur est renseignée, laissez-la vide`);
        }
      });
    }
  }
}

function scanHistory(problems: string[]) {
  const log = git("log", "--all", "-p", "--no-color", "--format=commit %H");
  let commit = "";
  let file = "";
  log.split("\n").forEach((line) => {
    if (line.startsWith("commit ")) commit = line.slice(7, 14);
    else if (line.startsWith("+++ b/")) file = line.slice(6);
    else if (line.startsWith("+") && !line.startsWith("+++")) {
      scanText(line.slice(1), () => `${commit} ${file}`, problems);
    }
  });
}

const problems: string[] = [];
const history = process.argv.includes("--history");
if (history) scanHistory(problems);
else scanWorkingTree(problems);

if (problems.length > 0) {
  console.error(`Secrets repérés (${problems.length}) :\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(history ? "Aucun secret dans l'historique Git." : "Aucun secret dans les fichiers du dépôt.");
}
