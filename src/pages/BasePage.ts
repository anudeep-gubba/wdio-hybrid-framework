import { browser, expect } from "@wdio/globals";

import { Logger } from "../utils/Logger.js";

/**
 * Shared navigation/assertion primitives, wrapping WDIO's `browser` global. Page objects extend
 * this and compose components (src/components/*) rather than calling $()/$$() inline; they must
 * not contain assertions or business rules — those belong in src/validators/*.ts.
 *
 * `navigate`/`verifyUrl`/`verifyTitle` are meaningful for web page objects; mobile page objects
 * extend this too (for `waitForLoad`) but simply don't call the URL-based methods since native
 * app screens have no URL.
 */
export abstract class BasePage {
  protected async navigate(path: string): Promise<void> {
    Logger.info(`Navigating to: ${path}`);
    await browser.url(path);
  }

  async reload(): Promise<void> {
    await browser.refresh();
  }

  async currentUrl(): Promise<string> {
    return browser.getUrl();
  }

  async verifyUrl(url: string | RegExp): Promise<void> {
    await expect(browser).toHaveUrl(url);
  }

  async verifyTitle(title: string | RegExp): Promise<void> {
    await expect(browser).toHaveTitle(title);
  }

  async waitForLoad(): Promise<void> {
    await browser.waitUntil(
      async () => (await browser.execute(() => document.readyState)) === "complete",
      { timeoutMsg: "Page did not finish loading in time" },
    );
  }

  protected getBrowser() {
    return browser;
  }
}
