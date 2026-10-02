import { describe, expect, it } from "vitest";
import { autoriserTache } from "./autorisation";

const SECRET = "un-secret-de-test-assez-long";

describe("autorisation de la tâche planifiée", () => {
  it("laisse passer la tâche planifiée de Vercel", () => {
    expect(autoriserTache(`Bearer ${SECRET}`, SECRET)).toEqual({ autorise: true });
  });

  it.each([
    [null, "secret absent"],
    ["", "secret absent"],
    ["Bearer mauvais", "secret incorrect"],
    [`Bearer ${SECRET}x`, "secret incorrect"],
    [SECRET, "secret incorrect"],
  ])("refuse %j (%s)", (autorisation, raison) => {
    expect(autoriserTache(autorisation, SECRET)).toEqual({ autorise: false, raison });
  });

  it("refuse tout quand le secret n'est pas configuré", () => {
    expect(autoriserTache(`Bearer ${SECRET}`, undefined)).toMatchObject({ autorise: false });
  });
});
