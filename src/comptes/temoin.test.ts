import { describe, expect, it } from "vitest";
import { temoinDeConnexion } from "./temoin";

describe("témoin de connexion", () => {
  it.each(["bestia_connecte=1", "theme=clair; bestia_connecte=1", "__Host-bestia_connecte=1; autre=2"])("se lit dans « %s »", (cookies) => {
    expect(temoinDeConnexion(cookies)).toBe(true);
  });

  it.each(["", "bestia_connecte=", "bestia_connecte=0", "faux_bestia_connecte=1", "bestia_connecte=12"])("est absent de « %s »", (cookies) => {
    expect(temoinDeConnexion(cookies)).toBe(false);
  });
});
