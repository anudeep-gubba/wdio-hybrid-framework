import { platformSelector } from "./PlatformLocator.js";

/**
 * The eventhub mobile app's sign-in screen. Locators are the Flutter app's own Semantics labels —
 * the same value Appium exposes as `accessibilityId` on iOS (`content-desc` on Android, since one
 * Flutter Semantics tree drives both) — verified live against a real iPhone 17 Pro Simulator
 * session (XCUITest page source captured via Appium, not guessed).
 *
 * `emailInput()`/`passwordInput()` locate by the field's own placeholder text ("you@email.com" /
 * the obscured "••••••"), which Flutter only exposes as the field's accessibility id while it is
 * empty — fine for the one-shot "type into a freshly-loaded screen" flow every mobile spec here
 * follows, but not for re-locating a field after it already holds text. That placeholder lives in a
 * different attribute per platform — verified live via a real `uiautomator dump`: iOS's XCUITest
 * publishes it as the field's `name` (so `~placeholder`/`accessibilityId` finds it directly), but
 * on Android the same field is an `android.widget.EditText` whose `content-desc` is empty — the
 * placeholder is its `hint` attribute instead, hence the platform-specific XPath — see
 * PlatformLocator.
 */
export class LoginPageLocators {
  static emailInput(): string {
    return platformSelector('//android.widget.EditText[@hint="you@email.com"]', "~you@email.com");
  }

  static passwordInput(): string {
    return platformSelector('//android.widget.EditText[@hint="••••••"]', "~••••••");
  }

  static readonly signInButton = "~Sign In";

  static readonly emailRequiredError = "~Email is required";

  static readonly passwordRequiredError = "~Password is required";

  static readonly invalidEmailError = "~Enter a valid email address";
}
