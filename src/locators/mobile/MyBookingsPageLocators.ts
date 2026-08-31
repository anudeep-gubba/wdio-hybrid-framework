import { platformSelector } from "./PlatformLocator.js";

/**
 * The eventhub mobile app's My Bookings screen: one card per booking (event name, booking
 * reference, status, tickets, total, booked date — all glued into one composite accessibility
 * label per card, verified live, the same pattern EventCardComponentLocators documents for the
 * Events listing) plus a "Clear all bookings" action.
 */
export class MyBookingsPageLocators {
  static readonly pageTitle = "~My Bookings";

  static readonly clearAllBookingsButton = "~Clear all bookings";

  /** A booking card mentioning both `eventName` and `bookingReference`. Platform-specific element class name — see PlatformLocator. */
  static bookingCard(eventName: string, bookingReference: string): string {
    return platformSelector(
      `//android.view.View[contains(@content-desc,"${eventName}") and contains(@content-desc,"${bookingReference}")]`,
      `//XCUIElementTypeOther[contains(@name,"${eventName}") and contains(@name,"${bookingReference}")]`,
    );
  }
}
