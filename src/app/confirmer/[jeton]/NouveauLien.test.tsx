// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JEU_INJOIGNABLE } from "@/app/inscription/etat";
import { NouveauLien } from "./NouveauLien";

describe("bouton « Recevoir un nouveau lien »", () => {
  afterEach(cleanup);

  it("demande un nouveau lien et dit qu'il est parti", async () => {
    const demander = vi.fn(async () => {});
    const u = userEvent.setup();
    render(<NouveauLien demander={demander} />);
    await u.click(screen.getByRole("button", { name: "Recevoir un nouveau lien" }));
    expect((await screen.findByRole("status")).textContent).toContain("Un nouveau lien vient de partir");
    expect(demander).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("prévient quand le jeu ne répond pas, et laisse réessayer", async () => {
    const demander = vi.fn(async () => Promise.reject(new Error("Failed to fetch")));
    const u = userEvent.setup();
    render(<NouveauLien demander={demander} />);
    await u.click(screen.getByRole("button", { name: "Recevoir un nouveau lien" }));
    expect((await screen.findByRole("alert")).textContent).toBe(JEU_INJOIGNABLE);
    expect(screen.getByRole("button", { name: "Recevoir un nouveau lien" })).toBeTruthy();
  });
});
