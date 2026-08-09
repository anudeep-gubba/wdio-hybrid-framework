import type { Frameworks, Options } from "@wdio/types";

import { ENV } from "./envLoader.js";
import { Logger } from "../src/utils/Logger.js";

// Settings common to every run — web, mobile AND api.
// Platform-specific configs (wdio.web/android/ios/api.conf.ts) spread this object and
// override/extend specs + capabilities. Lifecycle hooks here stand in for the fixture-level
// before/after hooks a Playwright framework would register per test — WDIO has no fixture
// injection, so this is the one place cross-cutting logging/reporting hooks live.
export const config: Options.Testrunner = {
  runner: "local",

  maxInstances: 1,

  framework: "mocha",

  reporters: [
    "spec",
    [
      "allure",
      {
        outputDir: "allure-results",
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
      },
    ],
  ],

  mochaOpts: {
    ui: "bdd",
    timeout: ENV.DEFAULT_TIMEOUT,
  },

  // Backs expect-webdriverio's built-in polling (toBeDisplayed(), etc.) and explicit
  // browser.waitUntil()-less waitFor* commands. Real backends (see LoginPage.getErrorMessage())
  // can take a few seconds to respond, so this is deliberately wired to ENV.EXPECT_TIMEOUT rather
  // than left at WDIO's 3s default.
  waitforTimeout: ENV.EXPECT_TIMEOUT,

  // Session-creation timeout. WDIO's 120s default is fine for web/api, but a first-time iOS run
  // has Appium/XCUITest compile and install WebDriverAgent via Xcode before the session responds —
  // that alone can exceed 2 minutes on a clean build. Bumped for every platform since a longer
  // ceiling costs nothing when session creation is already fast (web/api/warm-WDA mobile).
  connectionRetryTimeout: 5 * 60 * 1000,

  logLevel: "warn",

  beforeTest: function (test: Frameworks.Test): void {
    Logger.info("====================================");
    Logger.info(`Test        : ${test.title}`);
    Logger.info(`Environment : ${ENV.ENVIRONMENT}`);
    Logger.info("====================================");
  },

  afterTest: function (
    test: Frameworks.Test,
    _context: unknown,
    result: Frameworks.TestResult,
  ): void {
    Logger.info("====================================");
    Logger.info(`Status   : ${result.passed ? "passed" : "failed"}`);
    Logger.info(`Duration : ${result.duration} ms`);
    Logger.info("====================================");
    if (!result.passed) {
      Logger.error(`FAILED : ${test.title} -> ${result.error?.message ?? "unknown error"}`);
    }
  },
};
