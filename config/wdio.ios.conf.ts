import os from "os";
import path from "path";

import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";
import { ENV } from "./envLoader.js";
import { buildMobileCapabilities, resolveIosTarget } from "./mobileCapabilityBuilder.js";

// iOS config: what's under test (mobile web vs. a native app) is decided entirely by
// config/environments/<env>.env — see resolveIosTarget() in mobileCapabilityBuilder.ts. This file
// should not need editing to switch targets:
//   IOS_BUNDLE_ID set                     -> native app, already installed on the device
//   IOS_APP_PATH set (and no bundle id)    -> native app, installed from this .app/.ipa
//   neither set                            -> mobile web (Safari) — today's default, since
//                                              test/specs/mobile/login.spec.ts drives the same
//                                              EventHub web app as test/specs/web/ (see
//                                              src/pages/web/LoginPage.ts)
//
// Single vs. parallel is driven entirely by IOS_UDIDS (config/environments/<env>.env):
//   unset/empty                          -> single device, addressed by IOS_DEVICE_NAME (default)
//   "<simulator-udid-1>,<udid-2>,..."     -> one session per UDID, run in parallel
//
// Two concurrent XCUITest sessions on one host don't just need distinct wdaLocalPort — verified
// live that they also serialize (worker 1's session didn't start until worker 0's had fully
// finished) unless each gets its own WebDriverAgent build. A unique derivedDataPath per device
// fixes that: Xcode's DerivedData build lock otherwise serializes concurrent `xcodebuild`
// invocations that both target the same shared default folder. (Tried pairing this with
// `usePrebuiltWDA: true` too, expecting it'd speed up rebuilds — it doesn't combine with a fresh
// per-device path: that capability skips the build-or-reuse check entirely and assumes a build
// already exists at the path, so on a first run into an empty derivedDataPath it just fails
// (`xcodebuild` exit 65) instead of building. Left out — Appium already auto-detects and reuses a
// build once one exists at a given derivedDataPath, without needing this capability at all.)
const capabilities = buildMobileCapabilities({
  platformName: ENV.MOBILE.IOS.PLATFORM_NAME,
  automationName: ENV.MOBILE.IOS.AUTOMATION_NAME,
  deviceName: ENV.MOBILE.IOS.DEVICE_NAME,
  platformVersion: ENV.MOBILE.IOS.PLATFORM_VERSION,
  udids: ENV.MOBILE.IOS.UDIDS,
  portCapabilityKey: "appium:wdaLocalPort",
  portBase: 8100,
  extraCapabilitiesForIndex: (index) => ({
    "appium:derivedDataPath": path.join(os.tmpdir(), `wdio-wda-derived-data-${index}`),
  }),
  ...resolveIosTarget(ENV.MOBILE.IOS),
});

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...shared,
  // Needed for mobile-web mode: LoginPage.navigate() calls browser.url("/login"), a relative path
  // that only resolves against a configured baseUrl (no-op in native-app mode, harmless to set).
  baseUrl: ENV.BASE_URL,
  specs: ["../test/specs/mobile/**/*.ts"],
  // One worker per device: capabilities.length is 1 in single-device mode, N when IOS_UDIDS
  // lists N simulators/devices. Each capability also caps itself at `wdio:maxInstances: 1` (see
  // mobileCapabilityBuilder.ts) so a device is never double-booked.
  maxInstances: capabilities.length,
  services: ["appium"],
  capabilities,
};
