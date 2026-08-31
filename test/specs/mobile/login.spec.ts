import { browser } from "@wdio/globals";

import { LoginPage } from "../../../src/pages/mobile/LoginPage.js";
import { HomePage } from "../../../src/pages/mobile/HomePage.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData } from "../../../src/data/models/index.js";
import { LoginValidator } from "../../../src/validators/LoginValidator.js";
import { MobileUser } from "../../../src/models/index.js";

const loginData = TestData.load<LoginData>("loginData");

/**
 * Native app: eventhub's own mobile client (apps/eventhub-app-release.apk /
 * apps/eventhub-app-simulator.app — see config/environments/qa.env's ANDROID_APP_PATH/
 * IOS_APP_PATH), the same product the Web/API suites already cover. Locators
 * (src/locators/mobile/LoginPageLocators.ts) were verified live against the real app, not guessed.
 *
 * This build's login always succeeds regardless of password (mock auth) — see LoginPage's class
 * doc — so "negative login" here means Flutter's own client-side form validation (blank fields, a
 * malformed email), not a server-rejected wrong password.
 */
describe("Authentication :: Login (Mobile)", () => {
  let loginPage: LoginPage;

  beforeEach(async () => {
    // Every test starts from a fresh relaunch, then guarantees a logged-out start — a successful
    // login in one test leaves the app on the Home screen, which would break a login test running
    // right after it (see LoginPage.loginIfNeeded()/HomePage.logoutIfLoggedIn()'s docs for why app
    // state persists across tests in the same run).
    await browser.reloadSession();
    loginPage = new LoginPage();
    await loginPage.waitForLoad();
    await new HomePage().logoutIfLoggedIn();
  });

  describe("Positive Scenarios", () => {
    it("Valid user should login successfully @smoke", async () => {
      const user: MobileUser = structuredClone(loginData.mobile.validUser);

      await loginPage.login(user);

      LoginValidator.expectMobileLoginSuccess(await new HomePage().isDisplayed());
    });

    it("Login should still succeed with an incorrect password @regression", async () => {
      // Deliberately a positive case, not a negative one: this build's mock auth accepts any
      // well-formed credentials — see LoginPage's class doc.
      const user: MobileUser = structuredClone(loginData.mobile.incorrectPassword);

      await loginPage.login(user);

      LoginValidator.expectMobileLoginSuccess(await new HomePage().isDisplayed());
    });
  });

  it("Blank credentials should show required-field validation @regression", async () => {
    const user: MobileUser = structuredClone(loginData.mobile.blankCredentials);

    await loginPage.login(user);

    LoginValidator.expectMobileEmailRequiredErrorShown(
      await loginPage.isEmailRequiredErrorDisplayed(),
    );
    LoginValidator.expectMobilePasswordRequiredErrorShown(
      await loginPage.isPasswordRequiredErrorDisplayed(),
    );
    LoginValidator.expectMobileStillOnLoginScreen(await loginPage.isDisplayed());
  });

  it("Malformed email should show invalid-email validation @regression", async () => {
    const user: MobileUser = structuredClone(loginData.mobile.malformedEmail);

    await loginPage.login(user);

    LoginValidator.expectMobileInvalidEmailErrorShown(
      await loginPage.isInvalidEmailErrorDisplayed(),
    );
    LoginValidator.expectMobileStillOnLoginScreen(await loginPage.isDisplayed());
  });
});
