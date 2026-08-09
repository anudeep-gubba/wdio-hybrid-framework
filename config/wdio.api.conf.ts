import type { Capabilities, Options } from "@wdio/types";

import { config as shared } from "./wdio.shared.conf.js";

// API specs never touch `browser`/`$` — they exercise ApiFacade (axios under the hood) directly.
// They still run through `wdio run` (not a plain mocha invocation) so the same @wdio/allure-reporter
// pipeline used by web/mobile also captures API request/response attachments and step reporting.
// A single headless Chrome session is opened purely to satisfy the runner; it's never navigated.
export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...shared,
  specs: ["../test/specs/api/**/*.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: ["--headless=new", "--disable-gpu", "--window-size=800,600"],
      },
    },
  ],
};
