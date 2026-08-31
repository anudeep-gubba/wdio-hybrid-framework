/**
 * One repeated event card on the eventhub mobile app's Events listing. Unlike a typical component,
 * this Flutter build exposes each card as a single leaf element whose own accessibility label is
 * the whole card's text glued together with newlines — verified live: `"Concert\nIndie Music
 * Night\nSat, 14 Nov\nThe Blue Note Lounge, Austin\n$45.00\n128 seats left!"` — so
 * EventCardComponent parses that text instead of locating children.
 *
 * The "Book Now" button is a *sibling* of the card, not a descendant (verified live), so it can't
 * be found scoped under the card's own root — EventCardComponent instead indexes into the screen's
 * own flat list of "Book Now" buttons at the card's position, which EventsPage.getEventCards()
 * guarantees lines up 1:1 with the card list.
 */
export class EventCardComponentLocators {
  static readonly bookNowButton = "~Book Now";
}
