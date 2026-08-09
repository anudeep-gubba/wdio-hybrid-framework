import type { Capabilities } from "@wdio/types";

interface MobileCapabilityInputBase {
  platformName: string;
  automationName: string;
  deviceName: string;
  platformVersion: string;
  /** Empty -> single-device mode. Non-empty -> one capability (and session) per UDID, in parallel. */
  udids: string[];
  /**
   * The vendor capability that must be unique per *concurrent* session on the same host —
   * `appium:systemPort` for UiAutomator2 (Android), `appium:wdaLocalPort` for XCUITest (iOS).
   * Without this, two simultaneous sessions on one machine fight over the same port and one fails.
   */
  portCapabilityKey: "appium:systemPort" | "appium:wdaLocalPort";
  portBase: number;
  extraCapabilities?: Record<string, unknown>;
  /**
   * Extra capabilities that must differ *per device* (unlike `extraCapabilities`, which is the
   * same object on every entry). Currently only iOS needs this — see wdio.ios.conf.ts for why.
   */
  extraCapabilitiesForIndex?: (index: number) => Record<string, unknown>;
}

export type MobileTarget =
  /** Mobile web: automate a real browser (e.g. "Chrome" on Android, "Safari" on iOS). */
  | {
      browserName: string;
      appPath?: undefined;
      appPackage?: undefined;
      appActivity?: undefined;
      bundleId?: undefined;
    }
  /** Native app: fresh install from a built artifact. */
  | {
      appPath: string;
      browserName?: undefined;
      appPackage?: undefined;
      appActivity?: undefined;
      bundleId?: undefined;
    }
  /** Native app: already installed on the device — Android launches it by package + activity. */
  | {
      appPackage: string;
      appActivity: string;
      browserName?: undefined;
      appPath?: undefined;
      bundleId?: undefined;
    }
  /** Native app: already installed on the device — iOS launches it by bundle id. */
  | {
      bundleId: string;
      browserName?: undefined;
      appPath?: undefined;
      appPackage?: undefined;
      appActivity?: undefined;
    };

export type MobileCapabilityInput = MobileCapabilityInputBase & MobileTarget;

interface AndroidEnvConfig {
  APP_PACKAGE: string;
  APP_ACTIVITY: string;
  APP_PATH: string;
}

interface IosEnvConfig {
  BUNDLE_ID: string;
  APP_PATH: string;
}

/**
 * Picks mobile-web vs. native-app purely from which env vars are set — this (not the wdio.*.conf.ts
 * files) is the one place that decision gets made, so switching what's under test is a `.env` edit,
 * never a config-file edit:
 *   ANDROID_APP_PATH set                                -> native app, installed fresh from this .apk
 *   ANDROID_APP_PACKAGE + ANDROID_APP_ACTIVITY (no path)  -> native app, already installed on the device
 *   neither                                              -> mobile web (Chrome)
 *
 * APP_PATH wins when both are set: a fresh emulator/simulator has nothing pre-installed, so
 * package+activity alone (which just launches by identifier, no install step) would fail there.
 * The .apk/.app path both installs (via Appium) and launches, so it's the safer default whenever
 * a real artifact is available — package+activity is for the narrower "already installed, e.g. a
 * pre-baked CI image" case, and only takes over when no artifact is given at all.
 */
export function resolveAndroidTarget(android: AndroidEnvConfig): MobileTarget {
  if (android.APP_PATH) {
    return { appPath: android.APP_PATH };
  }
  if (android.APP_PACKAGE && android.APP_ACTIVITY) {
    return { appPackage: android.APP_PACKAGE, appActivity: android.APP_ACTIVITY };
  }
  return { browserName: "Chrome" };
}

/** Same priority as resolveAndroidTarget(), for iOS: IOS_APP_PATH -> IOS_BUNDLE_ID -> Safari. */
export function resolveIosTarget(ios: IosEnvConfig): MobileTarget {
  if (ios.APP_PATH) {
    return { appPath: ios.APP_PATH };
  }
  if (ios.BUNDLE_ID) {
    return { bundleId: ios.BUNDLE_ID };
  }
  return { browserName: "Safari" };
}

function targetCapabilities(target: MobileTarget): Record<string, unknown> {
  if (target.browserName) {
    return { browserName: target.browserName };
  }
  if (target.appPackage) {
    return { "appium:appPackage": target.appPackage, "appium:appActivity": target.appActivity };
  }
  if (target.bundleId) {
    return { "appium:bundleId": target.bundleId };
  }
  return { "appium:app": target.appPath };
}

/**
 * Builds the `capabilities` array for a mobile platform config from ENV.MOBILE.ANDROID/IOS.
 *
 *  - UDIDS empty  -> one capability, addressed by device name (today's default: a single
 *    emulator/simulator/device, matching how this framework worked before parallel support).
 *  - UDIDS set    -> one capability per UDID, each pinned to its own port and capped at
 *    `wdio:maxInstances: 1` so exactly one session ever runs against that one device at a time,
 *    while the array as a whole runs in parallel (see wdio.android.conf.ts / wdio.ios.conf.ts,
 *    which set the runner's total `maxInstances` to `capabilities.length`).
 */
export function buildMobileCapabilities(
  input: MobileCapabilityInput,
): Capabilities.RequestedStandaloneCapabilities[] {
  const base = {
    platformName: input.platformName,
    "appium:automationName": input.automationName,
    "appium:newCommandTimeout": 240,
    "wdio:maxInstances": 1,
    ...targetCapabilities(input),
    ...(input.extraCapabilities ?? {}),
  };

  if (input.udids.length === 0) {
    return [
      {
        ...base,
        "appium:deviceName": input.deviceName,
        ...(input.platformVersion ? { "appium:platformVersion": input.platformVersion } : {}),
        ...(input.extraCapabilitiesForIndex?.(0) ?? {}),
      },
    ];
  }

  return input.udids.map((udid, index) => ({
    ...base,
    "appium:udid": udid,
    "appium:deviceName": udid,
    ...(input.platformVersion ? { "appium:platformVersion": input.platformVersion } : {}),
    [input.portCapabilityKey]: input.portBase + index,
    ...(input.extraCapabilitiesForIndex?.(index) ?? {}),
  }));
}
