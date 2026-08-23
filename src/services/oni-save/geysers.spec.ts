import { GeyserTypeNames } from "oni-save-parser";

import { geyserDisplayName, geyserTypesByName } from "./geysers";

// Stands in for i18next: returns the game's name where one exists, and the
// caller's default otherwise.
const NAMES: Record<string, string> = {
  "oni:GEYSERS.hot_steam.NAME": "Steam Vent",
  "oni:GEYSERS.steam.NAME": "Cool Steam Vent",
  "oni:GEYSERS.molten_aluminum.NAME": "Aluminum Volcano",
};
const t = (key: string, { defaultValue }: { defaultValue: string }) =>
  NAMES[key] ?? defaultValue;

describe("geyserDisplayName", () => {
  it("uses the game's name for the type", () => {
    expect(geyserDisplayName("hot_steam", t)).toBe("Steam Vent");
  });

  // Every type has a catalogue name today, but a game update can add one before
  // the translations are regenerated. Showing the raw id beats showing nothing.
  it("falls back to the raw type when the catalogue has no name", () => {
    expect(geyserDisplayName("not_a_real_geyser", t)).toBe("not_a_real_geyser");
  });
});

describe("geyserTypesByName", () => {
  it("lists every type the parser models", () => {
    expect(geyserTypesByName(t)).toHaveLength(GeyserTypeNames.length);
    expect(geyserTypesByName(t)).toEqual(
      expect.arrayContaining([...GeyserTypeNames]),
    );
  });

  // The dropdown was in enum order, which is neither alphabetical by id nor by
  // name. Sorting matches the trait, skill and effect lists.
  it("orders by the displayed name, not the raw type", () => {
    const ordered = geyserTypesByName(t);
    expect(ordered.indexOf("molten_aluminum")).toBeLessThan(
      ordered.indexOf("steam"),
    );
    expect(ordered.indexOf("steam")).toBeLessThan(ordered.indexOf("hot_steam"));
  });

  it("does not mutate the parser's list", () => {
    const before = [...GeyserTypeNames];
    geyserTypesByName(t);
    expect([...GeyserTypeNames]).toEqual(before);
  });
});
