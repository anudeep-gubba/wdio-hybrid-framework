import { $$ } from "@wdio/globals";

import { BaseComponent } from "../base/BaseComponent.js";
import { EventCardComponentLocators } from "../../locators/mobile/EventCardComponentLocators.js";
import { EventsPageLocators } from "../../locators/mobile/EventsPageLocators.js";

/**
 * One repeated event card on the eventhub mobile app's Events listing — see
 * src/locators/mobile/EventCardComponentLocators.ts for why the getters below parse the card's
 * own glued-together text instead of locating child elements, and why `tapBookNow()` indexes into
 * a page-wide flat list rather than searching scoped under this card's root.
 *
 * Built from `(selector, index)` rather than an already-resolved element: `$$(selector)[index]`
 * stays a lazy `ChainablePromiseElement` (WDIO's own documented indexing idiom), so this component
 * fits `BaseComponent`'s constructor the same way every other component does, instead of needing a
 * separate resolved-element variant just for this one N-repeated case.
 */
export class EventCardComponent extends BaseComponent {
  constructor(private readonly index: number) {
    super($$(EventsPageLocators.eventCard())[index]);
  }

  async getName(): Promise<string> {
    return (await this.lines())[1];
  }

  async getPrice(): Promise<string> {
    const lines = await this.lines();
    return lines[lines.length - 2];
  }

  async getSeatsLeftText(): Promise<string> {
    const lines = await this.lines();
    return lines[lines.length - 1];
  }

  async tapBookNow(): Promise<void> {
    await $$(EventCardComponentLocators.bookNowButton)[this.index].click();
  }

  private async lines(): Promise<string[]> {
    const text = await this.element.getText();
    return text.split("\n");
  }
}
