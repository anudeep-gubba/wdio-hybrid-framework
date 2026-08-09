import { browser } from "@wdio/globals";

import { LoginPage } from "../../../src/pages/mobile/LoginPage.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData } from "../../../src/data/models/index.js";
import { LoginValidator } from "../../../src/validators/LoginValidator.js";
import { MobileUser } from "../../../src/models/index.js";

const loginData = TestData.load<LoginData>("loginData");

/**
 * Native app: Sauce Labs "Swag Labs" demo app (apps/swaglabs.apk / apps/swag.app — see
 * config/environments/qa.env's ANDROID_APP_PATH/IOS_APP_PATH). Locators
 * (src/locators/mobile/LoginPageLocators.ts) were verified live against the real app, not guessed.
 */
describe("Authentication :: Login (Mobile)", () => {
  let loginPage: LoginPage;

  beforeEach(async () => {
    // Both tests share one app session (one per device — see wdio.android/ios.conf.ts's
    // `wdio:maxInstances: 1` per capability). A successful login leaves the app on the products
    // screen, which would break a login test running after it, so every test starts from a fresh
    // relaunch rather than relying on test order for isolation.
    await browser.reloadSession();
    loginPage = new LoginPage();
    await loginPage.waitForLoad();
  });

  describe("Positive Scenarios", () => {
    it("Valid user should login successfully @smoke", async () => {
      const user: MobileUser = structuredClone(loginData.mobile.validUser);

      await loginPage.login(user);

      LoginValidator.expectMobileLoginSuccess(await loginPage.isLoginSuccessful());
    });
  });

  it("Invalid password should display login error @regression", async () => {
    const user: MobileUser = structuredClone(loginData.mobile.invalidPassword);

    await loginPage.login(user);

    LoginValidator.expectMobileLoginFailed(await loginPage.getErrorMessage());
  });
});
