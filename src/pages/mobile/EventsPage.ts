import { $$ } from "@wdio/globals";

import { BasePage } from "../BasePage.js";
import { EventsPageLocators } from "../../locators/mobile/EventsPageLocators.js";
import { EventCardComponent } from "../../components/mobile/EventCardComponent.js";

/** The eventhub mobile app's full event listing. Reached via HomePage.browseEvents(). */
export class EventsPage extends BasePage {
  async isDisplayed(): Promise<boolean> {
    return this.isDisplayedWithinTimeout(EventsPageLocators.pageTitle);
  }

  async getEventCards(): Promise<EventCardComponent[]> {
    const cards = await $$(EventsPageLocators.eventCard()).getElements();
    return cards.map((_, index) => new EventCardComponent(index));
  }
}
