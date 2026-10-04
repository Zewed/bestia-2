import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { paletteHex } from "../../scripts/lib/couleurs";
import couleurs from "./couleurs-emails.json";
import { echapper, miseEnForme } from "./mise-en-forme";

const racine = join(__dirname, "..", "..");
const palette = readFileSync(join(racine, "src/styles/palette.css"), "utf8");

describe("mise en forme des e-mails", () => {
  it("reprend les couleurs actuelles de la palette (sinon : npm run emails)", () => {
    expect(couleurs).toEqual({
      encre: paletteHex(palette, "--encre"),
      citron: paletteHex(palette, "--citron"),
      fond: paletteHex(palette, "--fond"),
      bloc: paletteHex(palette, "--bloc"),
      texte: paletteHex(palette, "--texte-2"),
      discret: paletteHex(palette, "--texte-discret"),
      trait: paletteHex(palette, "--trait-doux"),
    });
  });

  it("a son loup en image, les messageries ne lisant pas les dessins SVG", async () => {
    const { width, height, format } = await sharp(join(racine, "public/emails/loup.png")).metadata();
    expect({ width, height, format }).toEqual({ width: 128, height: 128, format: "png" });
  });

  it("échappe tout ce qu'elle glisse dans le HTML", () => {
    expect(echapper(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    const html = miseEnForme({ titre: "<script>", bouton: { texte: "Aller", lien: 'https://bestia.test/?a=1&b="2"' }, site: "https://bestia.test" });
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="https://bestia.test/?a=1&amp;b=&quot;2&quot;"');
  });

  it("centre le tout, avec les couleurs de la palette écrites en clair pour les messageries", () => {
    const html = miseEnForme({ titre: "Titre", bouton: { texte: "Aller", lien: "https://bestia.test" }, site: "https://bestia.test" });
    expect(html).toContain('<td align="center" style="padding:36px 32px;');
    expect(html).toContain(`bgcolor="${couleurs.encre}"`);
    expect(html).toContain(`background:${couleurs.fond}`);
  });
});
