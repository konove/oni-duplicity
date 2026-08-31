import platform from "platform";

const OS_WINDOWS = /windows/i;
const OS_MAC = /Mac|iOS|(OS X)/;
const OS_LINUX = /linux/i;

export type OSType = "windows" | "mac" | "linux" | "unknown";

const osPlatform = (platform.os && platform.os.family) || "unknown";
export const OSType: OSType = OS_WINDOWS.test(osPlatform)
  ? "windows"
  : OS_MAC.test(osPlatform)
    ? "mac"
    : OS_LINUX.test(osPlatform)
      ? "linux"
      : "unknown";

export const isProd: boolean = process.env.NODE_ENV === "production";

/**
 * True only under `webpack serve`.
 *
 * Deliberately not `!isProd`: there are three environments, not two, and jest
 * runs in the third with `NODE_ENV=test`. Anything gated on "am I in
 * development" - noisy logging, in-page debug output - has to ask this rather
 * than negate `isProd`, or it turns itself on during the test run.
 */
export const isDev: boolean = process.env.NODE_ENV === "development";
