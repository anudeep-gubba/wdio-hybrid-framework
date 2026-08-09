import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";
import { ENV } from "./envLoader.js";
import { getSecret } from "./secretsLoader.js";
import { buildMobileCapabilities, resolveAndroidTarget } from "./mobileCapabilityBuilder.js";
import {
  buildBrowserStackCapabilities,
  parseBrowserStackDevices,
} from "./browserstackCapabilityBuilder.js";

type MobileConfig = Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities;

/**
 * Local Appium server + a booted emulator (today's default — `MOBILE_EXECUTION_TARGET` unset).
 * What's under test (mobile web vs. a native app, and which native app) is decided entirely by
 * config/environments/<env>.env — see resolveAndroidTarget() in mobileCapabilityBuilder.ts:
 *   ANDROID_APP_PATH set                        -> native app, installed fresh from this .apk
 *   ANDROID_APP_PACKAGE + ANDROID_APP_ACTIVITY  -> native app, already installed (no ANDROID_APP_PATH)
 *   neither                                     -> mobile web (Chrome) — see
 *                                                   test/specs/mobile/login.spec.ts
 *
 * Single vs. parallel is driven entirely by ANDROID_UDIDS:
 *   unset/empty                        -> single device, addressed by ANDROID_DEVICE_NAME (default)
 *   "emulator-5554,emulator-5556,..."   -> one session per UDID, run in parallel
 */
function buildLocalConfig(): MobileConfig {
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

  return {
    ...shared,
    // Needed for mobile-web mode: LoginPage.navigate() calls browser.url("/login"), a relative
    // path that only resolves against a configured baseUrl (no-op in native-app mode, harmless).
    baseUrl: ENV.BASE_URL,
    specs: ["../test/specs/mobile/**/*.ts"],
    // One worker per device: capabilities.length is 1 in single-device mode, N when ANDROID_UDIDS
    // lists N devices. Each capability also caps itself at `wdio:maxInstances: 1` (see
    // mobileCapabilityBuilder.ts) so a device is never double-booked.
    maxInstances: capabilities.length,
    services: ["appium"],
    capabilities,
  };
}

/**
 * BrowserStack App Automate (`MOBILE_EXECUTION_TARGET=browserstack`) — a real device farm instead
 * of a local emulator, e.g. for CI where no Android emulator is available. Always native-app mode:
 * "already installed" doesn't meaningfully apply to BrowserStack's ephemeral cloud devices, so
 * this requires ANDROID_APP_PATH regardless of ANDROID_APP_PACKAGE/ANDROID_APP_ACTIVITY.
 * `@wdio/browserstack-service`'s `app` option uploads that local .apk automatically — no manual
 * upload step, no `appium:app` capability to set by hand.
 *
 * Credentials come from config/secrets/<env>.secrets.json ONLY (`browserstackUsername`/
 * `browserstackAccessKey`) — never from `.env`, same rule as every other secret in this framework.
 */
function buildBrowserStackConfig(): MobileConfig {
  if (!ENV.MOBILE.ANDROID.APP_PATH) {
    throw new Error(
      "MOBILE_EXECUTION_TARGET=browserstack requires ANDROID_APP_PATH (a local .apk — " +
        "@wdio/browserstack-service uploads it automatically). Set it in " +
        `config/environments/${ENV.ENVIRONMENT}.env.`,
    );
  }

  const devices = parseBrowserStackDevices(
    ENV.BROWSERSTACK.ANDROID_DEVICES || "Google Pixel 7@13.0",
  );

  return {
    ...shared,
    baseUrl: ENV.BASE_URL,
    specs: ["../test/specs/mobile/**/*.ts"],
    // BrowserStack allocates/queues devices itself — one worker per device is still correct, but
    // there's no local port/derivedDataPath contention to manage (unlike buildLocalConfig()).
    maxInstances: devices.length,
    user: getSecret(ENV.SECRETS, ENV.ENVIRONMENT, "browserstackUsername"),
    key: getSecret(ENV.SECRETS, ENV.ENVIRONMENT, "browserstackAccessKey"),
    services: [["browserstack", { app: ENV.MOBILE.ANDROID.APP_PATH }]],
    capabilities: buildBrowserStackCapabilities({
      platformName: "Android",
      devices,
      automationName: "UiAutomator2",
      projectName: ENV.BROWSERSTACK.PROJECT_NAME,
      buildName: ENV.BROWSERSTACK.BUILD_NAME,
    }),
  };
}

export const config: MobileConfig =
  ENV.MOBILE_EXECUTION_TARGET === "browserstack" ? buildBrowserStackConfig() : buildLocalConfig();
