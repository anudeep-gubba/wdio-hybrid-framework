import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";
import { ENV } from "./envLoader.js";

// Web-only config: points at the web specs, runs in Chrome, no Appium service.
// Parallel vs. single-instance is just ENV.WEB.MAX_INSTANCES (WEB_MAX_INSTANCES env var) — with
// more than one spec file under test/specs/web/, WDIO's local runner fans them out across that
// many concurrent Chrome sessions automatically. Set WEB_MAX_INSTANCES=1 to force serial execution.
export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...shared,
  baseUrl: ENV.BASE_URL,
  specs: ["../test/specs/web/**/*.ts"],
  maxInstances: ENV.WEB.MAX_INSTANCES,
  capabilities: [
    {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: [
          "--window-size=1440,900",
          ...(ENV.HEADLESS ? ["--headless=new", "--disable-gpu"] : []),
        ],
      },
    },
  ],
  // no `services` here — Appium isn't needed for browser tests
};
