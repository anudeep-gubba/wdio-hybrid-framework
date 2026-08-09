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

  /** Native mobile (Swag Labs demo app, via src/pages/mobile/LoginPage.ts). */
  static expectMobileLoginFailed(message: string): void {
    expect(message).toContain(Messages.MOBILE_LOGIN_FAILURE);
  }

  static expectMobileLoginSuccess(isLoginSuccessful: boolean): void {
    expect(isLoginSuccessful).toBe(true);
  }
}
