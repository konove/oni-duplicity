import { saveFilePath } from "./save-file-paths";

describe("saveFilePath", () => {
  it("points a Windows player at the Klei folder under Documents", () => {
    expect(saveFilePath("windows")).toBe(
      "Documents/Klei/OxygenNotIncluded/save_files",
    );
  });

  it("points a Linux player at the unity3d config folder", () => {
    expect(saveFilePath("linux")).toBe(
      "~/.config/unity3d/Klei/Oxygen Not Included/save_files",
    );
  });

  // The mac entry was `null`, so macOS visitors were shown no path at all -
  // the one platform where the folder is genuinely hard to find by hand.
  it("points a macOS player at Application Support", () => {
    expect(saveFilePath("mac")).toBe(
      "~/Library/Application Support/unity.Klei.Oxygen Not Included/save_files",
    );
  });

  it("has nothing to offer a platform it cannot identify", () => {
    expect(saveFilePath("unknown")).toBeNull();
  });
});
