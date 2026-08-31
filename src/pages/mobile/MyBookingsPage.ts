import { $ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { MyBookingsPageLocators } from "../../locators/mobile/MyBookingsPageLocators.js";
import { AllureHelper } from "../../reporting/index.js";

/**
 * The eventhub mobile app's My Bookings screen. Reached via
 * BookingConfirmationPage.tapViewMyBookings().
 */
export class MyBookingsPage extends BasePage {
  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(MyBookingsPageLocators.pageTitle);
  }

  async hasBookingFor(eventName: string, bookingReference: string): Promise<boolean> {
    return this.isDisplayedWithinTimeout(
      MyBookingsPageLocators.bookingCard(eventName, bookingReference),
    );
  }

  /** No-op if there is nothing to clear — used for post-test cleanup, not asserted on. */
  async clearAllBookingsIfPresent(): Promise<void> {
    if (await this.isDisplayedWithinTimeout(MyBookingsPageLocators.clearAllBookingsButton)) {
      await AllureHelper.step("Clear all bookings", async () => {
        await $(MyBookingsPageLocators.clearAllBookingsButton).click();
      });
    }
  }
}
