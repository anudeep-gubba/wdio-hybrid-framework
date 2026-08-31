import { browser } from "@wdio/globals";

/**
 * Resolves to one of two platform-specific selector strings based on the active Appium session
 * (`browser.isAndroid`/`browser.isIOS`, populated once the session exists — so, unlike the plain
 * `static readonly` strings elsewhere in src/locators/, a selector that differs per platform must
 * be a function called at use time, not a module-load-time constant).
 *
 * Only needed for the handful of locators that genuinely differ per platform: an XPath anchored to
 * a platform-specific element class name (`XCUIElementType*` on iOS vs. `android.view.View`/
 * `android.widget.*` on Android — this app is Flutter, which renders its own widgets rather than
 * native ones and exposes every one of them under that single class per platform), or a text
 * field's placeholder, which iOS exposes as the element's own `name` (so `~placeholder`, i.e.
 * `accessibilityId`, finds it directly) but Android exposes as its `hint` attribute instead of
 * `content-desc` (so it needs its own XPath). Locators built from `accessibilityId` (`~...`) don't
 * need this at all: one Flutter Semantics tree drives both iOS `accessibilityId` and Android
 * `content-desc` through that same strategy — verified live against a real iPhone 17 Pro Simulator.
 */
export function platformSelector(android: string, ios: string): string {
  return browser.isAndroid ? android : ios;
}
