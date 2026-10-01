import type { Metadata } from "next";
import "@/styles/palette.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bestia",
  description: "Apprivoisez les bêtes d'un monde sauvage et levez votre armée.",
  // Le commit d'où vient la version en ligne, lisible dans le code de la page.
  other: { "bestia-version": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
