// La mise en forme des e-mails du jeu (US-0127). Les messageries ne lisent ni les feuilles de
// style ni les variables : des tableaux et des styles écrits dans chaque balise, des couleurs en
// hexadécimal tirées de la palette (src/emails/couleurs-emails.json, npm run emails), et le loup
// en image. Côté serveur uniquement.
import "server-only";
import couleurs from "./couleurs-emails.json";

const POLICE = "'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Échappe un texte pour le glisser sans risque dans le HTML. */
export function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Contenu = {
  titre: string;
  bouton: { texte: string; lien: string };
  /** L'adresse du site, pour l'image du loup. */
  site: string;
};

/** Un e-mail court et centré : le loup, un titre, un bouton. Rien d'autre. */
export function miseEnForme({ titre, bouton, site }: Contenu): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${echapper(titre)}</title>
</head>
<body style="margin:0;padding:0;background:${couleurs.fond};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${couleurs.fond};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:${couleurs.bloc};border-radius:14px;">
<tr><td align="center" style="padding:36px 32px;font-family:${POLICE};text-align:center;">
<img src="${echapper(site)}/emails/loup.png" width="64" height="64" alt="Bestia" style="display:block;border:0;margin:0 auto 20px;">
<h1 style="margin:0 0 24px;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;text-align:center;color:${couleurs.encre};">${echapper(titre)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="center" bgcolor="${couleurs.encre}" style="border-radius:10px;">
<a href="${echapper(bouton.lien)}" style="display:block;padding:15px 24px;font-family:${POLICE};font-size:16px;font-weight:800;color:${couleurs.bloc};text-decoration:none;border-radius:10px;">${echapper(bouton.texte)}</a>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
