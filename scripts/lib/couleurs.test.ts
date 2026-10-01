import { describe, expect, it } from "vitest";
import { oklchToHex, paletteHex } from "./couleurs";

describe("conversion oklch vers hexadécimal", () => {
  it.each([
    [1, 0, 0, "#ffffff"],
    [0, 0, 0, "#000000"],
    [0.6279554, 0.2576833, 29.2338851, "#ff0000"],
    [0.4520137, 0.3132144, 264.0520206, "#0000ff"],
  ])("oklch(%s %s %s) → %s", (l, c, h, hex) => {
    expect(oklchToHex(l, c, h)).toBe(hex);
  });

  it("lit une couleur de la palette par son nom", () => {
    expect(paletteHex("--encre: oklch(1 0 0);", "--encre")).toBe("#ffffff");
    expect(() => paletteHex("", "--absente")).toThrow(/--absente/);
  });
});
