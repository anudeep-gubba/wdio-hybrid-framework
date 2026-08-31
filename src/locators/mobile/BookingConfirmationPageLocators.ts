import { platformSelector } from "./PlatformLocator.js";

/**
 * The eventhub mobile app's post-booking confirmation screen ("Booking confirmed!", a
 * server-generated booking reference, and a link to My Bookings — verified live).
 */
export class BookingConfirmationPageLocators {
  static readonly confirmedTitle = "~Booking confirmed!";

  /**
   * "Booking Reference" is a label; its value is the very next sibling static-text element —
   * verified live. Platform-specific element class name: `android.view.View`'s `content-desc` on
   * Android, `XCUIElementTypeStaticText`'s `name` on iOS.
   */
  static bookingReferenceValue(): string {
    return platformSelector(
      '//android.view.View[@content-desc="Booking Reference"]/following-sibling::android.view.View[1]',
      '//XCUIElementTypeStaticText[@name="Booking Reference"]/following-sibling::XCUIElementTypeStaticText[1]',
    );
  }

  static readonly viewMyBookingsButton = "~View My Bookings";
}
