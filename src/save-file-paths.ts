import { OSType } from "@/runtime-env";

/**
 * Where Oxygen Not Included keeps its save files, per platform.
 *
 * Transcribed from README.md, which is where this project has always recorded
 * them. `unknown` has no answer to give and says so rather than guessing at a
 * path that would send someone looking in the wrong place.
 */
const SAVE_FILE_PATHS: Record<OSType, string | null> = {
  windows: "Documents/Klei/OxygenNotIncluded/save_files",
  mac: "~/Library/Application Support/unity.Klei.Oxygen Not Included/save_files",
  linux: "~/.config/unity3d/Klei/Oxygen Not Included/save_files",
  unknown: null,
};

export function saveFilePath(os: OSType): string | null {
  return SAVE_FILE_PATHS[os];
}
