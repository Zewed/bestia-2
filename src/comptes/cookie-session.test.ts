import { describe, expect, it } from "vitest";
import { nomDuCookie } from "./cookie-session";

describe("cookie de session", () => {
  it("porte le préfixe __Host- en ligne, qui l'empêche de sortir du site ou de passer en clair", () => {
    expect(nomDuCookie({ VERCEL_ENV: "production" })).toBe("__Host-bestia_session");
    expect(nomDuCookie({ VERCEL_ENV: "preview" })).toBe("__Host-bestia_session");
    expect(nomDuCookie({})).toBe("bestia_session");
  });
});
