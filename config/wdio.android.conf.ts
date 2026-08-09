import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";
import { ENV } from "./envLoader.js";
import { buildMobileCapabilities, resolveAndroidTarget } from "./mobileCapabilityBuilder.js";

// Android config: what's under test (mobile web vs. a native app, and which native app) is decided
// entirely by config/environments/<env>.env — see resolveAndroidTarget() in
// mobileCapabilityBuilder.ts. This file should not need editing to switch targets:
//   ANDROID_APP_PACKAGE + ANDROID_APP_ACTIVITY set -> native app, already installed on the device
//   ANDROID_APP_PATH set (and no package/activity)  -> native app, installed from this .apk
//   neither set                                     -> mobile web (Chrome) — today's default,
//                                                       since test/specs/mobile/login.spec.ts
//                                                       drives the same EventHub web app as
//                                                       test/specs/web/ (see src/pages/web/LoginPage.ts)
//
// Single vs. parallel is driven entirely by ANDROID_UDIDS (config/environments/<env>.env):
//   unset/empty                        -> single device, addressed by ANDROID_DEVICE_NAME (default)
//   "emulator-5554,emulator-5556,..."   -> one session per UDID, run in parallel
const capabilities = buildMobileCapabilities({
  platformName: ENV.MOBILE.ANDROID.PLATFORM_NAME,
  automationName: ENV.MOBILE.ANDROID.AUTOMATION_NAME,
  deviceName: ENV.MOBILE.ANDROID.DEVICE_NAME,
  platformVersion: ENV.MOBILE.ANDROID.PLATFORM_VERSION,
  udids: ENV.MOBILE.ANDROID.UDIDS,
  portCapabilityKey: "appium:systemPort",
  portBase: 8200,
  extraCapabilities: {
    "appium:autoGrantPermissions": true,
    "appium:chromedriverAutodownload": true,
  },
  ...resolveAndroidTarget(ENV.MOBILE.ANDROID),
});

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...shared,
  // Needed for mobile-web mode: LoginPage.navigate() calls browser.url("/login"), a relative path
  // that only resolves against a configured baseUrl (no-op in native-app mode, harmless to set).
  baseUrl: ENV.BASE_URL,
  specs: ["../test/specs/mobile/**/*.ts"],
  // One worker per device: capabilities.length is 1 in single-device mode, N when ANDROID_UDIDS
  // lists N devices. Each capability also caps itself at `wdio:maxInstances: 1` (see
  // mobileCapabilityBuilder.ts) so a device is never double-booked.
  maxInstances: capabilities.length,
  services: ["appium"],
  capabilities,
};
