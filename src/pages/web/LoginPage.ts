import { $, browser } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { Button, Label, TextBox } from "../../components/index.js";
import { LoginPageLocators } from "../../locators/web/LoginPageLocators.js";
import { AppRoutes } from "../../constants/index.js";
import { User } from "../../models/index.js";
import { AllureHelper } from "../../reporting/index.js";

export class LoginPage extends BasePage {
  private readonly email: TextBox;
  private readonly password: TextBox;
  private readonly loginButton: Button;
  private readonly errorMessage: Label;

  constructor() {
    super();

    this.email = new TextBox($(LoginPageLocators.email));

    this.password = new TextBox($(LoginPageLocators.password));

    this.loginButton = new Button($(LoginPageLocators.loginButton));

    this.errorMessage = new Label($(LoginPageLocators.loginErrorMessage));
  }

  async navigate(): Promise<void> {
    await super.navigate(AppRoutes.LOGIN);
  }

  async login(user: User): Promise<void> {
    await AllureHelper.step("Enter Email", async () => {
      await this.email.enter(user.email);
    });

    await AllureHelper.step("Enter Password", async () => {
      await this.password.enter(user.password);
    });

    await AllureHelper.step("Click Login", async () => {
      await this.loginButton.click();
    });
  }

  override async waitForLoad(): Promise<void> {
    await browser.waitUntil(async () => !(await this.currentUrl()).includes("/login"), {
      timeout: 15000,
      timeoutMsg: "Did not navigate away from /login after login",
    });
  }

  async getErrorMessage(): Promise<string> {
    // The toast container is always in the DOM (even empty) and stays "displayed" by some
    // WebDriver implementations' isDisplayed() even with no content (confirmed on iOS
    // Safari/XCUITest — unlike desktop Chrome, which happens to collapse the empty flex container
    // to zero size). Poll the actual text instead of container visibility, so this doesn't depend
    // on a driver-specific visibility quirk.
    await browser.waitUntil(async () => (await this.errorMessage.text()).trim().length > 0, {
      timeout: 15000,
      timeoutMsg: "Error toast did not render any text in time",
    });

    return this.errorMessage.text();
  }
}
