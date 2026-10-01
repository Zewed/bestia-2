import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Plages Unicode des sous-ensembles de Google Fonts (fonts.google.com, « latin » et « latin-ext »).
const SUBSET_RANGES: Record<string, [number, number][]> = {
  latin: [
    [0x0000, 0x00ff], [0x0131, 0x0131], [0x0152, 0x0153], [0x02bb, 0x02bc], [0x02c6, 0x02c6],
    [0x02da, 0x02da], [0x02dc, 0x02dc], [0x0304, 0x0304], [0x0308, 0x0308], [0x0329, 0x0329],
    [0x2000, 0x206f], [0x20ac, 0x20ac], [0x2122, 0x2122], [0x2191, 0x2191], [0x2193, 0x2193],
    [0x2212, 0x2212], [0x2215, 0x2215], [0xfeff, 0xfeff], [0xfffd, 0xfffd],
  ],
  "latin-ext": [[0x0100, 0x02ba], [0x02bd, 0x02c5], [0x02c7, 0x02cc], [0x02ce, 0x02d7], [0x02dd, 0x02ff], [0x1e00, 0x1eff]],
};

// Les caractères du jeu : accents, cédille, ligatures (Cœur sauvage), majuscules accentuées
// (Élevage, Épreuve), guillemets, espace insécable et points de suspension.
const GAME_TEXT = "éèêëàâîïôûùüçœæÉÈÊÀÂÎÔÛÇŒÆ«»’…  –";

const source = readFileSync(join(__dirname, "fonts.ts"), "utf8");
const subsets = [...(source.match(/subsets:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([\w-]+)"/g)].map((m) => m[1]);

describe("police", () => {
  it("charge un sous-ensemble connu", () => {
    expect(subsets.length).toBeGreaterThan(0);
    for (const subset of subsets) expect(SUBSET_RANGES).toHaveProperty(subset);
  });

  it("couvre tous les caractères du jeu", () => {
    const ranges = subsets.flatMap((subset) => SUBSET_RANGES[subset] ?? []);
    const missing = [...GAME_TEXT].filter((char) => {
      const code = char.codePointAt(0)!;
      return !ranges.some(([from, to]) => code >= from && code <= to);
    });
    expect(missing).toEqual([]);
  });
});
