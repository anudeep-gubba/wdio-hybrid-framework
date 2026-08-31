import { platformSelector } from "./PlatformLocator.js";

/**
 * The header present on every post-login screen of the eventhub mobile app (Home/Events/My
 * Bookings): the logged-in user's email and Logout — verified live to be siblings under one
 * unnamed container, rooted here on that container via a locator anchored to the Logout button
 * itself, since the container has no accessibility id of its own.
 *
 * Tapping Logout opens a confirmation dialog ("Log out?" / Cancel / Logout — verified live) whose
 * own confirm button shares the exact same accessibility id ("Logout") as the header button that
 * opened it. `logoutConfirmButton()` disambiguates the second tap with an XPath anchored to the
 * dialog's own title text, rather than risking an accessibility-id lookup matching the now-hidden
 * header button instead.
 */
export class HeaderComponentLocators {
  static root(): string {
    return platformSelector(
      '//android.widget.Button[@content-desc="Logout"]/..',
      '//XCUIElementTypeButton[@name="Logout"]/..',
    );
  }

  static readonly logoutButton = "~Logout";

  static logoutConfirmButton(): string {
    return platformSelector(
      '//android.view.View[@content-desc="Log out?"]/following::android.widget.Button[@content-desc="Logout"][1]',
      '//XCUIElementTypeStaticText[@name="Log out?"]/following::XCUIElementTypeButton[@name="Logout"][1]',
    );
  }

  static loggedInEmail(): string {
    return platformSelector(
      './/android.view.View[contains(@content-desc,"@")]',
      './/XCUIElementTypeStaticText[contains(@name,"@")]',
    );
  }
}
