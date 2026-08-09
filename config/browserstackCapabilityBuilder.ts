import type { Capabilities } from "@wdio/types";

export interface BrowserStackDevice {
  deviceName: string;
  osVersion: string;
}

/**
 * Parses `BROWSERSTACK_ANDROID_DEVICES`/`BROWSERSTACK_IOS_DEVICES`
 * ("DeviceName@OSVersion,DeviceName2@OSVersion2") into structured device specs. `@` (not `,`)
 * separates name from version since device names contain spaces but never `@`. One entry -> a
 * single-device run; more than one -> parallel — BrowserStack allocates/queues devices itself, so
 * unlike the local-execution path (wdio.android/ios.conf.ts's `buildMobileCapabilities()`) there's
 * no per-device port or derivedDataPath to juggle here.
 */
export function parseBrowserStackDevices(value: string): BrowserStackDevice[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [deviceName, osVersion] = entry.split("@").map((part) => part.trim());
      if (!deviceName || !osVersion) {
        throw new Error(
          `Invalid BrowserStack device "${entry}" — expected "DeviceName@OSVersion", e.g. ` +
            `"Google Pixel 7@13.0". Check BROWSERSTACK_ANDROID_DEVICES/BROWSERSTACK_IOS_DEVICES.`,
        );
      }

      return { deviceName, osVersion };
    });
}

export interface BrowserStackCapabilityInput {
  platformName: "Android" | "iOS";
  devices: BrowserStackDevice[];
  automationName: "UiAutomator2" | "XCUITest";
  projectName: string;
  buildName: string;
}

/**
 * Builds the `capabilities` array for a BrowserStack App Automate run. Deliberately doesn't set
 * `appium:app` here — `@wdio/browserstack-service`'s own `app` service option (a local file path,
 * set once in wdio.android/ios.conf.ts's `services` entry) uploads the app and injects that
 * capability automatically; duplicating it per-capability would just be redundant.
 */
export function buildBrowserStackCapabilities(
  input: BrowserStackCapabilityInput,
): Capabilities.RequestedStandaloneCapabilities[] {
  return input.devices.map((device) => ({
    platformName: input.platformName,
    "appium:automationName": input.automationName,
    "appium:deviceName": device.deviceName,
    "appium:platformVersion": device.osVersion,
    "bstack:options": {
      deviceName: device.deviceName,
      osVersion: device.osVersion,
      projectName: input.projectName,
      buildName: input.buildName,
      sessionName: `${input.platformName} — ${device.deviceName} (${device.osVersion})`,
      debug: true,
      networkLogs: true,
    },
  }));
}
