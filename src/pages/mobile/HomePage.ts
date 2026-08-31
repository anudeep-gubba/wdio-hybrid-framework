import { $ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { HomePageLocators } from "../../locators/mobile/HomePageLocators.js";
import { HeaderComponent } from "../../components/mobile/HeaderComponent.js";
import { AllureHelper } from "../../reporting/index.js";
import { EventsPage } from "./EventsPage.js";

/**
 * The eventhub mobile app's post-login landing screen. See
 * src/locators/mobile/HomePageLocators.ts — the header (logged-in email + Logout) is present on
 * every post-login screen, so `isDisplayed()` doubles as "is any post-login screen currently
 * showing", which is exactly what LoginPage.loginIfNeeded()/logoutIfLoggedIn() need.
 */
export class HomePage extends BasePage {
  /** Deliberately not cached as a field: re-located fresh on every call. */
  header(): HeaderComponent {
    return new HeaderComponent();
  }

  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(HomePageLocators.logoutButton);
  }

  async browseEvents(): Promise<EventsPage> {
    await AllureHelper.step("Tap 'Browse Events'", async () => {
      await $(HomePageLocators.browseEventsButton).click();
    });
    return new EventsPage();
  }

  /**
   * Logs out only if actually logged in; a no-op otherwise. Used by login.spec.ts's `beforeEach`
   * to guarantee a logged-out start for every login test, regardless of whatever state a previous
   * test in the same run left the app in — mirror image of LoginPage.loginIfNeeded()'s reasoning.
   */
  async logoutIfLoggedIn(): Promise<void> {
    if (await this.isDisplayed()) {
      await this.header().logout();
    }
  }
}
