import { $ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { BookingConfirmationPageLocators } from "../../locators/mobile/BookingConfirmationPageLocators.js";
import { AllureHelper } from "../../reporting/index.js";
import { MyBookingsPage } from "./MyBookingsPage.js";

/**
 * The eventhub mobile app's post-booking confirmation screen. Reached via
 * EventDetailPage.tapConfirmBooking().
 */
export class BookingConfirmationPage extends BasePage {
  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(BookingConfirmationPageLocators.confirmedTitle);
  }

  async getBookingReference(): Promise<string> {
    return $(BookingConfirmationPageLocators.bookingReferenceValue()).getText();
  }

  async tapViewMyBookings(): Promise<MyBookingsPage> {
    await AllureHelper.step("Tap 'View My Bookings'", async () => {
      await $(BookingConfirmationPageLocators.viewMyBookingsButton).click();
    });
    return new MyBookingsPage();
  }
}
