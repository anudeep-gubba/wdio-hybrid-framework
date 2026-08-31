import { expect } from "@wdio/globals";

/**
 * Mobile end-to-end booking journey assertions (login -> browse -> book -> confirm -> My
 * Bookings, src/pages/mobile/EventDetailPage.ts and onward), keeping expect(...) out of specs.
 */
export class BookingValidator {
  static expectLoggedIn(isHomeDisplayed: boolean): void {
    expect(isHomeDisplayed).toBe(true);
  }

  static expectEventDetailDisplayed(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectBookingConfirmed(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectBookingReferenceGenerated(reference: string): void {
    expect(reference.trim()).not.toBe("");
  }

  static expectMyBookingsDisplayed(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectBookingVisibleInMyBookings(isPresent: boolean): void {
    expect(isPresent).toBe(true);
  }
}
