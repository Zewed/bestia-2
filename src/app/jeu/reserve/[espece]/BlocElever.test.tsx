// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// L'action serveur d'un Élevage demandé (actions.test.ts, actions.db.test.ts) : ici, ce que le bloc en montre.
const actions = vi.hoisted(() => ({ elever: vi.fn(async () => ({ refus: null })) }));
vi.mock("./actions", () => actions);

import { BlocElever } from "./BlocElever";

describe("le bloc « Élever » de la fiche d'une Espèce (US-0812)", () => {
  afterEach(cleanup);

  /** Le bloc, sous son titre « Élever ». */
  const bloc = () => screen.getByRole("heading", { name: "Élever" }).closest("section")!;

  it("propose un bloc titré « Élever », que l'on peut viser d'un lien (#elever)", () => {
    render(<BlocElever especeId="poule" />);
    expect(document.getElementById("elever")?.contains(bloc())).toBe(true);
  });

  it("y met le bouton « Élever » pour l'Espèce de la fiche, grisé tant que l'Élevage ne se lance pas encore (US-0815)", () => {
    render(<BlocElever especeId="poule" />);
    const bouton = within(bloc()).getByRole("button", { name: "Élever" });
    expect((bouton as HTMLButtonElement).disabled).toBe(true);
    const formulaire = bouton.closest("form")!;
    expect(new FormData(formulaire).get("espece")).toBe("poule");
  });

  it("n'ajoute aucune phrase : le titre et le bouton", () => {
    render(<BlocElever especeId="poule" />);
    expect(bloc().textContent).toBe("ÉleverÉlever");
  });
});
