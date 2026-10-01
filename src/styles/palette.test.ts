import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const PALETTE = join(__dirname, "palette.css");

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const palette = readFileSync(PALETTE, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const tokens = [...palette.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => ({
  name,
  value: value.trim().replace(/\s+/g, " "),
}));

// Tout ce qui s'affiche : feuilles de style et composants, hors tests et hors palette.
const screens = filesIn(SRC).filter(
  (file) => /\.(css|tsx?)$/.test(file) && !file.endsWith(".test.ts") && file !== PALETTE,
);

const COLOR_LITERALS = [
  /#[0-9a-f]{3,8}\b(?![\w-]*\()/i,
  /\b(?:oklch|oklab|lch|lab|rgba?|hsla?|hwb|color)\(/i,
  /:\s*(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|brown)\b/i,
];

describe("palette", () => {
  it("donne un nom unique à chaque couleur", () => {
    const names = tokens.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    const values = tokens.map((t) => t.value);
    const doubles = values.filter((value, i) => values.indexOf(value) !== i);
    expect(doubles).toEqual([]);
  });

  it("reprend l'Encre et les fonds Bento du prototype", () => {
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t.value]));
    expect(byName["--encre"]).toBe("oklch(0.22 0.02 270)");
    expect(byName["--fond"]).toBe("oklch(0.955 0.008 90)");
    expect(byName["--citron"]).toBe("oklch(0.94 0.08 100)");
  });

  it("n'écrit aucune couleur en dur dans un écran", () => {
    const offenders = screens.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          COLOR_LITERALS.some((pattern) => pattern.test(line.replace(/\/\/.*$|\/\*.*?\*\//g, "")))
            ? [`${relative(SRC, file)}:${i + 1}`]
            : [],
        ),
    );
    expect(offenders).toEqual([]);
  });

  it("n'utilise que des couleurs de la palette", () => {
    const defined = new Set([
      ...tokens.map((t) => t.name),
      ...screens.flatMap((file) => [...readFileSync(file, "utf8").matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
    ]);
    const unknown = screens.flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/var\((--[\w-]+)/g)]
        .map((m) => m[1])
        .filter((name) => !defined.has(name))
        .map((name) => `${relative(SRC, file)} : ${name}`),
    );
    expect(unknown).toEqual([]);
  });
});
