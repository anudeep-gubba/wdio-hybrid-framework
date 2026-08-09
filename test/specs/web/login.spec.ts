import { LoginPage } from "../../../src/pages/web/LoginPage.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData } from "../../../src/data/models/index.js";
import { LoginValidator } from "../../../src/validators/LoginValidator.js";
import { User } from "../../../src/models/index.js";

const loginData = TestData.load<LoginData>("loginData");

describe("Authentication :: Login (Web)", () => {
  let loginPage: LoginPage;

  beforeEach(() => {
    // No Playwright-style fixture injection in WDIO — page objects are plain classes,
    // instantiated directly per test.
    loginPage = new LoginPage();
  });

  describe("Positive Scenarios", () => {
    it("Valid user should login successfully @smoke", async () => {
      const user: User = structuredClone(loginData.web.validUser);

      await loginPage.navigate();

      await loginPage.login(user);

      await loginPage.waitForLoad();

      LoginValidator.expectLoginSuccess(await loginPage.currentUrl());
    });
  });

  const negativeScenarios: Array<[string, User]> = [
    ["Invalid password", loginData.web.invalidPassword],
    ["Invalid email", loginData.web.invalidEmail],
  ];

  for (const [name, user] of negativeScenarios) {
    it(`${name} should display login error @regression`, async () => {
      const loginUser = structuredClone(user);

      await loginPage.navigate();

      await loginPage.login(loginUser);

      LoginValidator.expectLoginFailed(await loginPage.getErrorMessage());
    });
  }
});
