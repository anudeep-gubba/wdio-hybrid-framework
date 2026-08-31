import { $ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { EventDetailPageLocators } from "../../locators/mobile/EventDetailPageLocators.js";
import { AllureHelper } from "../../reporting/index.js";
import { BookingConfirmationPage } from "./BookingConfirmationPage.js";

/** The W3C/Selenium "Return" keycode — see typeAndDismissKeyboard()'s doc for why it's appended in-line. */
const RETURN_KEY = "\uE007";

/**
 * The eventhub mobile app's event detail screen, which also carries the booking form itself
 * (attendee full name, phone, ticket count, Confirm Booking) — one screen, verified live. Reached
 * via EventCardComponent.tapBookNow(). See src/locators/mobile/EventDetailPageLocators.ts for why
 * the attendee Email field and the ticket-count stepper aren't driven here.
 */
export class EventDetailPage extends BasePage {
  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(EventDetailPageLocators.pageTitle);
  }

  /**
   * The form fields load off-screen below the fold, so each entry point scrolls to itself first,
   * then dismisses the on-screen keyboard afterward — see typeAndDismissKeyboard().
   */
  async enterFullName(fullName: string): Promise<void> {
    await AllureHelper.step("Enter attendee full name", async () => {
      await this.typeAndDismissKeyboard(EventDetailPageLocators.fullNameInput(), fullName);
    });
  }

  async enterPhone(phone: string): Promise<void> {
    await AllureHelper.step("Enter attendee phone", async () => {
      await this.typeAndDismissKeyboard(EventDetailPageLocators.phoneInput(), phone);
    });
  }

  async tapConfirmBooking(): Promise<BookingConfirmationPage> {
    await AllureHelper.step("Tap Confirm Booking", async () => {
      const button = $(EventDetailPageLocators.confirmBookingButton);
      await button.scrollIntoView();
      await button.click();
    });
    return new BookingConfirmationPage();
  }

  /**
   * Scrolls the field into view, then types `value` followed by a Return keystroke in the *same*
   * `setValue` call — found in practice (ported from the framework this suite was migrated from,
   * verified live there): once a field is focused, the on-screen keyboard covers roughly the
   * bottom half of the screen, so it must be dismissed before the next field can be scrolled to.
   * A *separate* follow-up key command against the same field hit a stale-element error there (the
   * predictive-text bar appearing above the keyboard rebuilds the accessibility tree in between) —
   * appending the Return keycode (U+E007) to the same `setValue` string avoids the second command
   * entirely. The same keystroke also snaps the rest of the form into view in that build.
   */
  private async typeAndDismissKeyboard(selector: string, value: string): Promise<void> {
    const element = $(selector);
    await element.scrollIntoView();
    await element.setValue(value + RETURN_KEY);
  }
}
