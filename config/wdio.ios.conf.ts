import os from "os";
import path from "path";

import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";
import { ENV } from "./envLoader.js";
import { getSecret } from "./secretsLoader.js";
import { buildMobileCapabilities, resolveIosTarget } from "./mobileCapabilityBuilder.js";
import {
  buildBrowserStackCapabilities,
  parseBrowserStackDevices,
} from "./browserstackCapabilityBuilder.js";

type MobileConfig = Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities;

/**
 * Local Appium server + a booted simulator (today's default — `MOBILE_EXECUTION_TARGET` unset).
 * What's under test is decided entirely by config/environments/<env>.env — see resolveIosTarget()
 * in mobileCapabilityBuilder.ts:
 *   IOS_APP_PATH set                    -> native app, installed fresh from this .app/.ipa
 *   IOS_BUNDLE_ID                       -> native app, already installed (no IOS_APP_PATH)
 *   neither                             -> mobile web (Safari) — see test/specs/mobile/login.spec.ts
 *
 * Single vs. parallel is driven entirely by IOS_UDIDS:
 *   unset/empty                          -> single device, addressed by IOS_DEVICE_NAME (default)
 *   "<simulator-udid-1>,<udid-2>,..."     -> one session per UDID, run in parallel
 *
 * Two concurrent XCUITest sessions on one host don't just need distinct wdaLocalPort — verified
 * live that they also serialize (worker 1's session didn't start until worker 0's had fully
 * finished) unless each gets its own WebDriverAgent build. A unique derivedDataPath per device
 * fixes that: Xcode's DerivedData build lock otherwise serializes concurrent `xcodebuild`
 * invocations that both target the same shared folder. (Tried pairing this with
 * `usePrebuiltWDA: true` too, expecting it'd speed up rebuilds — it doesn't combine with a fresh
 * per-device path: that capability skips the build-or-reuse check entirely and assumes a build
 * already exists at the path, so on a first run into an empty derivedDataPath it just fails
 * (`xcodebuild` exit 65) instead of building. Left out — Appium already auto-detects and reuses a
 * build once one exists at a given derivedDataPath, without needing this capability at all.)
 */
function buildLocalConfig(): MobileConfig {
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

  return {
    ...shared,
    // Needed for mobile-web mode: LoginPage.navigate() calls browser.url("/login"), a relative
    // path that only resolves against a configured baseUrl (no-op in native-app mode, harmless).
    baseUrl: ENV.BASE_URL,
    specs: ["../test/specs/mobile/**/*.ts"],
    // One worker per device: capabilities.length is 1 in single-device mode, N when IOS_UDIDS
    // lists N simulators/devices. Each capability also caps itself at `wdio:maxInstances: 1` (see
    // mobileCapabilityBuilder.ts) so a device is never double-booked.
    maxInstances: capabilities.length,
    services: ["appium"],
    capabilities,
  };
}

/**
 * BrowserStack App Automate (`MOBILE_EXECUTION_TARGET=browserstack`) — a real device farm instead
 * of a local simulator, e.g. for CI where no macOS/Xcode runner is available. Always native-app
 * mode: "already installed" doesn't meaningfully apply to BrowserStack's ephemeral cloud devices,
 * so this requires IOS_APP_PATH regardless of IOS_BUNDLE_ID. `@wdio/browserstack-service`'s `app`
 * option uploads that local build automatically — no manual upload step.
 *
 * BrowserStack's real-device cloud needs a **real-device build** (a signed `.ipa`), not an
 * iOS-simulator `.app` bundle (apps/swag.app in this repo is a simulator build — see apps/README.md)
 * — an `.app` folder simply won't install on a physical device. That's a build/signing concern
 * outside this framework, not something `IOS_APP_PATH` pointing at the right file can work around.
 *
 * Credentials come from config/secrets/<env>.secrets.json ONLY (`browserstackUsername`/
 * `browserstackAccessKey`) — never from `.env`, same rule as every other secret in this framework.
 */
function buildBrowserStackConfig(): MobileConfig {
  if (!ENV.MOBILE.IOS.APP_PATH) {
    throw new Error(
      "MOBILE_EXECUTION_TARGET=browserstack requires IOS_APP_PATH (a local, real-device-signed " +
        ".ipa — @wdio/browserstack-service uploads it automatically; a simulator .app will not " +
        `run on a real device). Set it in config/environments/${ENV.ENVIRONMENT}.env.`,
    );
  }

  const devices = parseBrowserStackDevices(ENV.BROWSERSTACK.IOS_DEVICES || "iPhone 15@17");

  return {
    ...shared,
    baseUrl: ENV.BASE_URL,
    specs: ["../test/specs/mobile/**/*.ts"],
    // BrowserStack allocates/queues devices itself — one worker per device is still correct, but
    // there's no local port/derivedDataPath contention to manage (unlike buildLocalConfig()).
    maxInstances: devices.length,
    user: getSecret(ENV.SECRETS, ENV.ENVIRONMENT, "browserstackUsername"),
    key: getSecret(ENV.SECRETS, ENV.ENVIRONMENT, "browserstackAccessKey"),
    services: [["browserstack", { app: ENV.MOBILE.IOS.APP_PATH }]],
    capabilities: buildBrowserStackCapabilities({
      platformName: "iOS",
      devices,
      automationName: "XCUITest",
      projectName: ENV.BROWSERSTACK.PROJECT_NAME,
      buildName: ENV.BROWSERSTACK.BUILD_NAME,
    }),
  };
}

export const config: MobileConfig =
  ENV.MOBILE_EXECUTION_TARGET === "browserstack" ? buildBrowserStackConfig() : buildLocalConfig();
