import { $, browser } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { Button, Label, TextBox } from "../../components/index.js";
import { LoginPageLocators } from "../../locators/mobile/LoginPageLocators.js";
import { MobileUser } from "../../models/index.js";
import { AllureHelper } from "../../reporting/index.js";

/**
 * Native-app page object for the Swag Labs demo app's login screen (see
 * src/locators/mobile/LoginPageLocators.ts for where the accessibility ids came from). Unlike the
 * web/mobile-web LoginPage, there's no URL to navigate to or verify — `waitForLoad` waits for the
 * login button instead, and success is "the products screen appeared", not a URL change.
 */
export class LoginPage extends BasePage {
  private readonly username: TextBox;
  private readonly password: TextBox;
  private readonly loginButton: Button;
  private readonly errorMessage: Label;

  constructor() {
    super();

    this.username = new TextBox($(LoginPageLocators.username));

    this.password = new TextBox($(LoginPageLocators.password));

    this.loginButton = new Button($(LoginPageLocators.loginButton));

    this.errorMessage = new Label($(LoginPageLocators.errorMessage));
  }

  override async waitForLoad(): Promise<void> {
    await this.loginButton.getElement().waitForDisplayed();
  }

  async login(user: MobileUser): Promise<void> {
    await AllureHelper.step("Enter Username", async () => {
      await this.username.enter(user.username);
    });

    await AllureHelper.step("Enter Password", async () => {
      await this.password.enter(user.password);
    });

    await AllureHelper.step("Tap Login", async () => {
      await this.loginButton.click();
    });
  }

  async getErrorMessage(): Promise<string> {
    // Same reasoning as the web LoginPage's getErrorMessage(): poll actual text rather than
    // container visibility, which isn't a reliable "has content yet" signal across drivers.
    await browser.waitUntil(async () => (await this.errorMessage.text()).trim().length > 0, {
      timeout: 15000,
      timeoutMsg: "Error message did not render any text in time",
    });

    return this.errorMessage.text();
  }

  async isLoginSuccessful(): Promise<boolean> {
    return $(LoginPageLocators.productsHeader).isDisplayed();
  }
}
