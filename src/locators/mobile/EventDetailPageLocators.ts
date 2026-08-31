import { platformSelector } from "./PlatformLocator.js";

/**
 * The eventhub mobile app's event detail screen, which also carries the booking form itself
 * (attendee full name, phone, Confirm Booking) — one screen, verified live. The attendee Email
 * field is pre-filled from the logged-in account and has no accessibility id of its own once
 * populated (verified live), so it's intentionally not located here.
 */
export class EventDetailPageLocators {
  static readonly pageTitle = "~Event Details";

  // Placeholder-located, same platform split as LoginPageLocators' emailInput()/passwordInput():
  // an Android EditText's placeholder lives in its "hint" attribute, not content-desc.
  static fullNameInput(): string {
    return platformSelector('//android.widget.EditText[@hint="Your full name"]', "~Your full name");
  }

  static phoneInput(): string {
    return platformSelector(
      '//android.widget.EditText[@hint="+91 98765 43210"]',
      "~+91 98765 43210",
    );
  }

  static readonly confirmBookingButton = "~Confirm Booking";
}
