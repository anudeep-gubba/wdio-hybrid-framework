/**
 * Verified live against the real app (Sauce Labs "Swag Labs" demo app, apps/swaglabs.apk /
 * apps/swag.app — com.swaglabsmobileapp / com.saucelabs.SwagLabsMobileApp) via
 * `browser.getPageSource()` on a booted iOS simulator, not guessed. These are accessibility ids
 * (React Native testIDs), which this app exposes identically on iOS and Android — confirmed only
 * on iOS so far (no Android emulator was booted at the time); if Android ever needs a different
 * id, that's the one platform-specific override to make, not a reason to distrust the rest.
 */
export class LoginPageLocators {
  static readonly username = "~test-Username";

  static readonly password = "~test-Password";

  static readonly loginButton = "~test-LOGIN";

  static readonly errorMessage = "~test-Error message";

  /** Products screen header — present only after a successful login. */
  static readonly productsHeader = "~test-PRODUCTS";
}
