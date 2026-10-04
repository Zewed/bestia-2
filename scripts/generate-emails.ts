// Fabrique ce dont les e-mails ont besoin à partir de la palette : npm run emails
// Les messageries ne lisent ni les variables CSS, ni oklch, ni les dessins SVG : il leur faut
// des couleurs en hexadécimal et des images. À relancer si la palette change (un test le rappelle).
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { paletteHex } from "./lib/couleurs";
import { LOUP_TETE } from "../src/components/loup";

const palette = readFileSync("src/styles/palette.css", "utf8");
export const NOMS = { encre: "--encre", citron: "--citron", fond: "--fond", bloc: "--bloc", texte: "--texte-2", discret: "--texte-discret", trait: "--trait-doux" } as const;
const couleurs = Object.fromEntries(Object.entries(NOMS).map(([cle, nom]) => [cle, paletteHex(palette, nom)]));

// Le loup de Bestia sur un disque citron, comme sur l'écran « compte créé ».
const loup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="${couleurs.citron}"/><g transform="translate(24 24) scale(0.62) translate(-24 -25)"><path d="${LOUP_TETE}" fill="${couleurs.encre}"/></g></svg>`;

async function main() {
  writeFileSync("src/emails/couleurs-emails.json", `${JSON.stringify(couleurs, null, 2)}\n`);
  await sharp(Buffer.from(loup), { density: 72 * (128 / 48) * 2 }).resize(128, 128).png().toFile("public/emails/loup.png");
  console.log("Couleurs et loup des e-mails mis à jour.");
}

void main();
