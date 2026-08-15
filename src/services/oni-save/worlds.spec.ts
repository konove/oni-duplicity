import { WorldContainerBehavior, worldDisplayName } from "./worlds";

type WorldData = WorldContainerBehavior["templateData"];

function world(overrides: Partial<WorldData>): WorldData {
  return {
    id: 0,
    worldName: "dlc4::worlds/PrehistoricClassicAsteroid",
    overrideName: "",
    ...overrides,
  } as WorldData;
}

describe("worldDisplayName", () => {
  it("strips the namespace and path from the world name", () => {
    expect(worldDisplayName(world({}))).toBe("PrehistoricClassicAsteroid");
  });

  it("prefers a player rename", () => {
    expect(worldDisplayName(world({ overrideName: "Home" }))).toBe("Home");
  });

  it("falls back to the world id when there is no name at all", () => {
    expect(worldDisplayName(world({ id: 3, worldName: "" }))).toBe("World 3");
  });

  it("handles a missing behavior", () => {
    expect(worldDisplayName(null)).toBe("");
  });
});
