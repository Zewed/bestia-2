import type { Metadata, Viewport } from "next";
import { BarreHaut } from "@/components/BarreHaut";
import { jakarta } from "@/styles/fonts";
import "@/styles/palette.css";
import "@/styles/typographie.css";
import "@/styles/formes.css";
import couleurs from "./couleurs-app.json";
import "./globals.css";

export const metadata: Metadata = {
  // Chaque page peut compléter le titre : « Bestia · Accueil ».
  title: { default: "Bestia", template: "Bestia · %s" },
  appleWebApp: { title: "Bestia", capable: true, statusBarStyle: "black-translucent" },
  description: "Un monde sauvage, des bêtes à apprivoiser. Faites votre sac : l'aventure vous attend.",
  // Le commit d'où vient la version en ligne, lisible dans le code de la page.
  other: { "bestia-version": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
};

// La barre du navigateur sur mobile prend la couleur Encre de la barre du haut. La page s'étend
// sous l'encoche, et en laisse les bords libres (US-0164).
export const viewport: Viewport = { themeColor: couleurs.encre, viewportFit: "cover" };

// `actions` : ce que la barre du haut montre à droite, rempli par chaque page (src/app/@actions).
export default function RootLayout({ children, actions }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>
        <BarreHaut actions={actions} />
        {children}
      </body>
    </html>
  );
}
