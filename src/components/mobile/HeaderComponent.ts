import { $ } from "@wdio/globals";

import { BaseComponent } from "../base/BaseComponent.js";
import { HeaderComponentLocators } from "../../locators/mobile/HeaderComponentLocators.js";

/**
 * The header present on every post-login screen of the eventhub mobile app (Home/Events/My
 * Bookings) — see src/locators/mobile/HeaderComponentLocators.ts for the confirm-dialog
 * disambiguation `logout()` relies on.
 */
export class HeaderComponent extends BaseComponent {
  constructor() {
    super($(HeaderComponentLocators.root()));
  }

  async logout(): Promise<void> {
    await $(HeaderComponentLocators.logoutButton).click();
    await $(HeaderComponentLocators.logoutConfirmButton()).click();
  }

  async getLoggedInUserEmail(): Promise<string> {
    return this.element.$(HeaderComponentLocators.loggedInEmail()).getText();
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const email = await this.getLoggedInUserEmail();
      return email.trim().length > 0;
    } catch {
      return false;
    }
  }
}
