import { savedNameOf } from "./user-nameable";

describe("savedNameOf", () => {
  // The game names every geyser itself, code and all; the chlorine vent in
  // the mock save reads exactly like this.
  it("returns the name the game stored", () => {
    expect(savedNameOf("Cool Chlorine Gas Vent UO31‑3")).toBe(
      "Cool Chlorine Gas Vent UO31‑3",
    );
  });

  // Buildings store their name as rich text - a storage bin's savedName is
  // `<link="STORAGELOCKER">Storage Bin</link>` - and the tags are not a name.
  it("strips the game's rich-text markup", () => {
    expect(savedNameOf('<link="STORAGELOCKER">Storage Bin</link>')).toBe(
      "Storage Bin",
    );
  });

  it("is null for a missing, empty or blank name", () => {
    expect(savedNameOf(undefined)).toBe(null);
    expect(savedNameOf("")).toBe(null);
    expect(savedNameOf("   ")).toBe(null);
    expect(savedNameOf("<b></b>")).toBe(null);
  });
});
