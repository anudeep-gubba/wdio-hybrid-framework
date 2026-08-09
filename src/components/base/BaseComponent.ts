import { expect } from "@wdio/globals";
import type { ChainablePromiseElement } from "webdriverio";

/**
 * Wraps a WDIO `ChainablePromiseElement` (never a raw selector string) so page objects never
 * call `$()`/`$$()` inline when building UI actions — they build components instead. The same
 * `$()` element API works identically whether the active session is a browser or a mobile
 * (Appium) session, so this one class is shared by both web and mobile components.
 */
export abstract class BaseComponent {
  constructor(protected readonly element: ChainablePromiseElement) {}

  async isVisible(): Promise<void> {
    await expect(this.element).toBeDisplayed();
  }

  async isHidden(): Promise<void> {
    await expect(this.element).not.toBeDisplayed();
  }

  async isEnabled(): Promise<void> {
    await expect(this.element).toBeEnabled();
  }

  async isDisabled(): Promise<void> {
    await expect(this.element).not.toBeEnabled();
  }

  async scrollIntoView(): Promise<void> {
    await this.element.scrollIntoView();
  }

  getElement(): ChainablePromiseElement {
    return this.element;
  }
}
