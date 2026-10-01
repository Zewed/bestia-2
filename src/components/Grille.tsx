import type { ReactNode } from "react";
import styles from "./Grille.module.css";

/** Range les blocs comme le prototype : 12 colonnes sur ordinateur, une seule sur mobile. */
export function Grille({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={[styles.grille, className].filter(Boolean).join(" ")}>{children}</div>;
}
