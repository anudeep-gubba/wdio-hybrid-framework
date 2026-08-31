import { $ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { LoginPageLocators } from "../../locators/mobile/LoginPageLocators.js";
import { MobileUser } from "../../models/index.js";
import { AllureHelper } from "../../reporting/index.js";
import { HomePage } from "./HomePage.js";

/**
 * Native-app page object for the eventhub mobile app's sign-in screen (see
 * src/locators/mobile/LoginPageLocators.ts for where the accessibility ids came from). Unlike the
 * web LoginPage, there's no URL to navigate to or verify — `waitForLoad` waits for the Sign In
 * button instead, and success is "the post-login header appeared", not a URL change.
 *
 * **This build's login always succeeds, regardless of the password typed** — verified live: a
 * deliberately wrong password for a real account still lands on the Home screen, authenticated as
 * whichever account was entered. This build mocks auth rather than validating credentials against
 * a real backend, so "negative login" here means the client-side form validation Flutter itself
 * enforces before ever calling the network (blank fields, a malformed email) — the one thing that
 * actually rejects input in this build — not a server-rejected wrong password. See
 * test/specs/mobile/login.spec.ts.
 */
export class LoginPage extends BasePage {
  override async waitForLoad(): Promise<void> {
    await $(LoginPageLocators.signInButton).waitForDisplayed();
  }

  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(LoginPageLocators.signInButton);
  }

  async enterEmail(email: string): Promise<void> {
    await AllureHelper.step("Enter Email", async () => {
      await $(LoginPageLocators.emailInput()).setValue(email);
    });
  }

  async enterPassword(password: string): Promise<void> {
    await AllureHelper.step("Enter Password", async () => {
      await $(LoginPageLocators.passwordInput()).setValue(password);
    });
  }

  async tapSignIn(): Promise<void> {
    await AllureHelper.step("Tap Sign In", async () => {
      await $(LoginPageLocators.signInButton).click();
    });
  }

  async login(user: MobileUser): Promise<void> {
    await this.enterEmail(user.email);
    await this.enterPassword(user.password);
    await this.tapSignIn();
  }

  async isEmailRequiredErrorDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(LoginPageLocators.emailRequiredError);
  }

  async isPasswordRequiredErrorDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(LoginPageLocators.passwordRequiredError);
  }

  async isInvalidEmailErrorDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(LoginPageLocators.invalidEmailError);
  }

  /**
   * Logs in only if the login screen is actually showing; otherwise assumes a prior test in this
   * run already left the app signed in and returns the Home page as-is. Needed because this
   * framework's mobile driver capabilities don't request a fresh app-data reset on every session,
   * so app-level login state can persist across tests in the same run. Mirror image of
   * HomePage.logoutIfLoggedIn().
   */
  async loginIfNeeded(user: MobileUser): Promise<HomePage> {
    if (await this.isDisplayed()) {
      await this.login(user);
    }
    return new HomePage();
  }
}
