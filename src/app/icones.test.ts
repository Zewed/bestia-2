import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { paletteHex } from "../../scripts/lib/couleurs";
import couleurs from "./couleurs-app.json";
import manifest from "./manifest";
import { metadata } from "./layout";

// next/font ne tourne qu'avec Next : ici, une police factice suffit pour lire les métadonnées.
vi.mock("@/styles/fonts", () => ({ jakarta: { variable: "police" } }));

const root = join(__dirname, "..", "..");
const palette = readFileSync(join(root, "src/styles/palette.css"), "utf8");

describe("icônes et titre d'onglet", () => {
  it("reprennent les couleurs actuelles de la palette (sinon : npm run icones)", () => {
    expect(couleurs).toEqual({
      encre: paletteHex(palette, "--encre"),
      citron: paletteHex(palette, "--citron"),
      fond: paletteHex(palette, "--fond"),
    });
    const onglet = readFileSync(join(root, "src/app/icon.svg"), "utf8");
    expect(onglet).toContain(`fill="${couleurs.encre}"`);
    expect(onglet).toContain(`fill="${couleurs.citron}"`);
  });

  it.each([
    ["src/app/apple-icon.png", 180],
    ["public/icone-192.png", 192],
    ["public/icone-512.png", 512],
  ])("%s mesure %i px de côté", async (file, size) => {
    const { width, height, format } = await sharp(join(root, file)).metadata();
    expect({ width, height, format }).toEqual({ width: size, height: size, format: "png" });
  });

  it("garde l'icône du loup sur l'écran d'accueil d'un téléphone", () => {
    const m = manifest();
    expect(m.name).toBe("Bestia");
    expect(m.display).toBe("standalone");
    expect(m.icons?.map((i) => i.sizes)).toEqual(["192x192", "512x512", "512x512"]);
  });

  it("titre l'onglet « Bestia », que chaque page peut compléter", () => {
    expect(metadata.title).toEqual({ default: "Bestia", template: "Bestia · %s" });
  });
});
