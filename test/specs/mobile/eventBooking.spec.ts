import { browser } from "@wdio/globals";

import { LoginPage } from "../../../src/pages/mobile/LoginPage.js";
import { HomePage } from "../../../src/pages/mobile/HomePage.js";
import { EventDetailPage } from "../../../src/pages/mobile/EventDetailPage.js";
import { MyBookingsPage } from "../../../src/pages/mobile/MyBookingsPage.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData, MobileBookingData } from "../../../src/data/models/index.js";
import { EventsValidator } from "../../../src/validators/EventsValidator.js";
import { BookingValidator } from "../../../src/validators/BookingValidator.js";

const loginData = TestData.load<LoginData>("loginData");
const bookingData = TestData.load<MobileBookingData>("mobileBookingData");

/**
 * The mobile equivalent of the API layer's event-booking E2E flow: the same
 * "login -> browse -> book -> confirm -> shows up in My Bookings" journey, driven through the
 * real app UI (Appium) instead of direct HTTP calls — each step chains a real value read from the
 * previous screen (the event's name, the booking reference generated on confirmation) into the
 * next assertion. Individual screen positive/negative cases live in login.spec.ts/events.spec.ts.
 */
describe("Events :: Booking Journey (Mobile)", () => {
  let myBookingsPage: MyBookingsPage | undefined;

  beforeEach(async () => {
    await browser.reloadSession();
    const loginPage = new LoginPage();
    await loginPage.waitForLoad();
    const homePage = await loginPage.loginIfNeeded(structuredClone(loginData.mobile.validUser));
    BookingValidator.expectLoggedIn(await homePage.isDisplayed());
  });

  afterEach(async () => {
    await myBookingsPage?.clearAllBookingsIfPresent();
    myBookingsPage = undefined;
  });

  it("Booking flow from login through confirmation and My Bookings works end to end @smoke @regression", async () => {
    const data = structuredClone(bookingData);

    const eventsPage = await new HomePage().browseEvents();
    const cards = await eventsPage.getEventCards();
    EventsValidator.expectAtLeastOneEvent(cards.length);
    const firstCard = cards[0];
    const eventName = await firstCard.getName();
    await firstCard.tapBookNow();

    const eventDetailPage = new EventDetailPage();
    BookingValidator.expectEventDetailDisplayed(await eventDetailPage.isDisplayed());

    await eventDetailPage.enterFullName(data.fullName);
    await eventDetailPage.enterPhone(data.phone);
    const confirmationPage = await eventDetailPage.tapConfirmBooking();

    BookingValidator.expectBookingConfirmed(await confirmationPage.isDisplayed());
    const bookingReference = await confirmationPage.getBookingReference();
    BookingValidator.expectBookingReferenceGenerated(bookingReference);

    myBookingsPage = await confirmationPage.tapViewMyBookings();
    BookingValidator.expectMyBookingsDisplayed(await myBookingsPage.isDisplayed());
    BookingValidator.expectBookingVisibleInMyBookings(
      await myBookingsPage.hasBookingFor(eventName, bookingReference),
    );
  });
});
