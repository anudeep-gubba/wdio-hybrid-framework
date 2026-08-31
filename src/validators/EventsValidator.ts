import { expect } from "@wdio/globals";

/** Mobile Events listing assertions (src/pages/mobile/EventsPage.ts), keeping expect(...) out of specs. */
export class EventsValidator {
  static expectEventsListingDisplayed(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectAtLeastOneEvent(cardCount: number): void {
    expect(cardCount).toBeGreaterThan(0);
  }

  static expectNonBlankEventName(name: string): void {
    expect(name.trim()).not.toBe("");
  }

  static expectPriceIsDollarFormatted(price: string): void {
    expect(price).toMatch(/^\$/);
  }

  static expectDistinctEventNames(names: string[]): void {
    expect(new Set(names).size).toBe(names.length);
  }

  static expectEventDetailDisplayed(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }
}
