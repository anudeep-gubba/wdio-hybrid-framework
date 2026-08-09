import dotenv from "dotenv";
import path from "path";

import { loadSecrets } from "./secretsLoader.js";

export type TestDataFormat = "json" | "yaml" | "csv" | "excel";

const environment = process.env.TEST_ENV ?? "qa";

dotenv.config({
  path: path.resolve(process.cwd(), `config/environments/${environment}.env`),
});

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Environment variable '${key}' is missing. Set it in config/environments/${environment}.env`,
    );
  }

  return value;
}

/**
 * Comma-separated list env vars (e.g. "emulator-5554,emulator-5556") -> trimmed, non-empty entries.
 * An unset/empty var yields [] — callers treat that as "single-device mode".
 */
function list(key: string): string[] {
  return (process.env[key] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * ANDROID_APP_PATH/IOS_APP_PATH: a bare filename ("myapp.apk") resolves against apps/ (see
 * apps/README.md) so you never have to write the "apps/" prefix yourself. A value that already
 * contains a path separator — "apps/myapp.apk", "./myapp.apk", "../elsewhere/myapp.apk", or an
 * absolute path — is used as given, not doubled up. Always resolved to an absolute path, since
 * Appium's `appium:app` capability is more reliable with one than a path relative to whatever
 * directory the Appium server process happens to be started from.
 */
function resolveAppPath(key: string): string {
  const value = process.env[key];
  if (!value) {
    return "";
  }

  const relativeToRepoRoot =
    value.includes("/") || value.includes("\\") ? value : path.join("apps", value);

  return path.resolve(process.cwd(), relativeToRepoRoot);
}

export const ENV = Object.freeze({
  ENVIRONMENT: environment,

  BASE_URL: required("BASE_URL"),

  API_BASE_URL: required("API_BASE_URL"),

  TEST_DATA_FORMAT: required("TEST_DATA_FORMAT") as TestDataFormat,

  HEADLESS: process.env.HEADLESS === "true",

  DEFAULT_TIMEOUT: Number(process.env.DEFAULT_TIMEOUT ?? 60000),

  EXPECT_TIMEOUT: Number(process.env.EXPECT_TIMEOUT ?? 10000),

  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",

  // Real secrets — credentials today, API keys/tokens/whatever else later — never live in
  // config/environments/*.env (plain config) or src/data/datasets/ (committed test data).
  // config/secrets/<env>.secrets.json is a flat `key -> value` bag; a dataset value written as
  // `${someKey}` resolves against this automatically (src/data/utils/secretInterpolation.ts, wired
  // into every provider via src/data/providers/BaseDataProvider.ts) — see config/secrets/README.md.
  // Scales to any number of secrets without touching code: add a key to the JSON file, reference it.
  SECRETS: Object.freeze(loadSecrets(environment)),

  WEB: Object.freeze({
    // How many spec files run in parallel Chrome sessions. `npm run test:web` with the default
    // 1 spec file is single-instance regardless; add more spec files and this is what fans them out.
    MAX_INSTANCES: Number(process.env.WEB_MAX_INSTANCES ?? 2),
  }),

  // Mobile capabilities live here (not scattered in page objects/specs) so
  // wdio.android.conf.ts / wdio.ios.conf.ts are the single place that reads them. Those config
  // files never need editing to switch what's under test — see resolveAndroidTarget()/
  // resolveIosTarget() in mobileCapabilityBuilder.ts, which pick mobile-web vs. native-app purely
  // from which of these env vars are set:
  //   ANDROID_APP_PACKAGE + ANDROID_APP_ACTIVITY set -> native app, already installed on the device
  //   ANDROID_APP_PATH set (and no package/activity)  -> native app, installed from this .apk
  //   neither set                                     -> mobile web (Chrome) — today's default
  //   (IOS_BUNDLE_ID / IOS_APP_PATH / neither, same priority, for Safari on iOS)
  //
  // UDIDS is what switches a platform between single-device and parallel-across-devices mode:
  //   unset/empty        -> one capability, addressed by DEVICE_NAME (current default behavior)
  //   "udid1,udid2,..."   -> one capability per UDID, run in parallel, one session per device
  // See wdio.android.conf.ts / wdio.ios.conf.ts for how these get turned into `capabilities`.
  MOBILE: Object.freeze({
    ANDROID: Object.freeze({
      PLATFORM_NAME: process.env.ANDROID_PLATFORM_NAME ?? "Android",
      AUTOMATION_NAME: process.env.ANDROID_AUTOMATION_NAME ?? "UiAutomator2",
      DEVICE_NAME: process.env.ANDROID_DEVICE_NAME ?? "Android",
      PLATFORM_VERSION: process.env.ANDROID_PLATFORM_VERSION ?? "",
      UDIDS: list("ANDROID_UDIDS"),
      APP_PACKAGE: process.env.ANDROID_APP_PACKAGE ?? "",
      APP_ACTIVITY: process.env.ANDROID_APP_ACTIVITY ?? "",
      APP_PATH: resolveAppPath("ANDROID_APP_PATH"),
    }),
    IOS: Object.freeze({
      PLATFORM_NAME: process.env.IOS_PLATFORM_NAME ?? "iOS",
      AUTOMATION_NAME: process.env.IOS_AUTOMATION_NAME ?? "XCUITest",
      DEVICE_NAME: process.env.IOS_DEVICE_NAME ?? "iPhone 17",
      PLATFORM_VERSION: process.env.IOS_PLATFORM_VERSION ?? "",
      UDIDS: list("IOS_UDIDS"),
      BUNDLE_ID: process.env.IOS_BUNDLE_ID ?? "",
      APP_PATH: resolveAppPath("IOS_APP_PATH"),
    }),
  }),

  // Where mobile tests actually run — a device farm choice, not a secret, so it's plain config
  // here rather than in config/secrets/. "local" (default) is everything above: a local Appium
  // server + a booted emulator/simulator. "browserstack" runs on BrowserStack App Automate
  // instead — see config/browserstackCapabilityBuilder.ts and wdio.android/ios.conf.ts.
  MOBILE_EXECUTION_TARGET: (process.env.MOBILE_EXECUTION_TARGET === "browserstack"
    ? "browserstack"
    : "local") as "local" | "browserstack",

  BROWSERSTACK: Object.freeze({
    // "DeviceName@OSVersion,DeviceName2@OSVersion2" — see
    // config/browserstackCapabilityBuilder.ts's parseBrowserStackDevices(). One entry runs
    // single-device; more than one runs in parallel (BrowserStack allocates devices itself, no
    // local port/derivedDataPath juggling needed).
    ANDROID_DEVICES: process.env.BROWSERSTACK_ANDROID_DEVICES ?? "",
    IOS_DEVICES: process.env.BROWSERSTACK_IOS_DEVICES ?? "",
    // `||`, not `??`: config/environments/*.env sets these to an explicit empty string when left
    // blank (documented as "leave empty to use the default"), not undefined — `??` only falls
    // back on null/undefined, so it would silently keep the empty string instead of defaulting.
    // Verified live: BUILD_NAME came out as "" instead of "local-qa" with `??` before this fix.
    PROJECT_NAME: process.env.BROWSERSTACK_PROJECT_NAME || "wdio-hybrid-framework",
    BUILD_NAME: process.env.BROWSERSTACK_BUILD_NAME || `local-${environment}`,
  }),
});
