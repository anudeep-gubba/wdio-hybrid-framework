/**
 * The eventhub mobile app's post-login landing screen. The same header (logged-in email + Logout)
 * is present on every post-login screen (Home/Events/My Bookings) — verified live — so
 * `logoutButton` doubles as "is any post-login screen currently showing".
 */
export class HomePageLocators {
  static readonly logoutButton = "~Logout";

  static readonly browseEventsButton = "~Browse Events →";
}
