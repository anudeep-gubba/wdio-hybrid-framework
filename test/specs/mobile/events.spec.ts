import { browser } from "@wdio/globals";

import { LoginPage } from "../../../src/pages/mobile/LoginPage.js";
import { EventsPage } from "../../../src/pages/mobile/EventsPage.js";
import { EventDetailPage } from "../../../src/pages/mobile/EventDetailPage.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData } from "../../../src/data/models/index.js";
import { EventsValidator } from "../../../src/validators/EventsValidator.js";

const loginData = TestData.load<LoginData>("loginData");

/**
 * Mobile Component Object Model coverage for the eventhub app's Events listing:
 * HeaderComponent as a page-wide singleton component, EventCardComponent as an N-repeated
 * component — see src/components/mobile/EventCardComponent.ts for why each card's fields are
 * parsed from one glued-together text label rather than located as child elements.
 */
describe("Events :: Listing (Mobile)", () => {
  let eventsPage: EventsPage;

  beforeEach(async () => {
    await browser.reloadSession();
    const loginPage = new LoginPage();
    await loginPage.waitForLoad();
    const homePage = await loginPage.loginIfNeeded(structuredClone(loginData.mobile.validUser));

    eventsPage = await homePage.browseEvents();
    EventsValidator.expectEventsListingDisplayed(await eventsPage.isDisplayed());
  });

  it("Events listing shows at least one event @smoke", async () => {
    const cards = await eventsPage.getEventCards();
    EventsValidator.expectAtLeastOneEvent(cards.length);

    const first = cards[0];
    EventsValidator.expectNonBlankEventName(await first.getName());
    EventsValidator.expectPriceIsDollarFormatted(await first.getPrice());
  });

  it("Each event card is independently scoped @regression", async () => {
    const cards = await eventsPage.getEventCards();
    if (cards.length < 2) {
      // Needs at least 2 events on the backend to prove independent scoping — skip rather than
      // fail when the seeded catalog happens to have fewer.
      return;
    }

    const names = await Promise.all(cards.map((card) => card.getName()));
    EventsValidator.expectDistinctEventNames(names);
  });

  it("Book Now navigates to the event detail page @regression", async () => {
    const cards = await eventsPage.getEventCards();
    EventsValidator.expectAtLeastOneEvent(cards.length);

    await cards[0].tapBookNow();

    const detailPage = new EventDetailPage();
    EventsValidator.expectEventDetailDisplayed(await detailPage.isDisplayed());
  });
});
