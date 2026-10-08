// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErreurDeLaCarte from "./error";

afterEach(cleanup);

describe("l'échec de la carte (US-0434)", () => {
  it("dit que la carte n'a pas pu s'afficher, à sa place, et propose de réessayer", () => {
    render(<ErreurDeLaCarte error={new Error("panne")} retry={() => {}} />);
    expect(screen.getByRole("alert").textContent).toBe("La carte n'a pas pu s'afficher.");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Carte");
    expect(screen.getByRole("alert").closest("section")).not.toBeNull();
  });

  it("réessaie d'un geste : la page relit la carte", async () => {
    const retry = vi.fn();
    render(<ErreurDeLaCarte error={new Error("panne")} retry={retry} />);
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
