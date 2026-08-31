import { platformSelector } from "./PlatformLocator.js";

/** The eventhub mobile app's full event listing, reached via HomePage.browseEvents(). */
export class EventsPageLocators {
  static readonly pageTitle = "~Events";

  /**
   * Each card is a leaf element whose composite label always ends in "seats left!" — verified
   * live — rather than carrying its own dedicated accessibility id. The element class name that
   * label lives under is platform-specific (Flutter renders its own widgets, not native ones):
   * `android.view.View`'s `content-desc` on Android, `XCUIElementTypeOther`'s `name` on iOS.
   */
  static eventCard(): string {
    return platformSelector(
      '//android.view.View[contains(@content-desc,"seats left")]',
      '//XCUIElementTypeOther[contains(@name,"seats left")]',
    );
  }
}
