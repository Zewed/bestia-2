import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bestia",
  description: "Apprivoisez les bêtes d'un monde sauvage et levez votre armée.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
