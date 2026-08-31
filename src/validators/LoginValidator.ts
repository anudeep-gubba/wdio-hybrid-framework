import { expect } from "@wdio/globals";

import { Messages } from "../constants/index.js";

export class LoginValidator {
  /** Web/mobile-web (EventHub, via src/pages/web/LoginPage.ts). */
  static expectLoginFailed(message: string): void {
    expect(message).toContain(Messages.LOGIN_FAILURE);
  }

  static expectLoginSuccess(currentUrl: string): void {
    expect(currentUrl).not.toContain("/login");
  }

  /**
   * Native mobile (eventhub app, via src/pages/mobile/LoginPage.ts). Unlike Web, this build's
   * login always succeeds regardless of password (mock auth) — negative cases are Flutter's own
   * client-side form validation, so these assert on the validation UI's *presence* (a boolean),
   * not a message string.
   */
  static expectMobileLoginSuccess(isHomeDisplayed: boolean): void {
    expect(isHomeDisplayed).toBe(true);
  }

  static expectMobileStillOnLoginScreen(isLoginDisplayed: boolean): void {
    expect(isLoginDisplayed).toBe(true);
  }

  static expectMobileEmailRequiredErrorShown(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectMobilePasswordRequiredErrorShown(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }

  static expectMobileInvalidEmailErrorShown(isDisplayed: boolean): void {
    expect(isDisplayed).toBe(true);
  }
}
