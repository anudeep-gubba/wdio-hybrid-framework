/**
 * Attendee details for the eventhub mobile app's booking form (src/pages/mobile/EventDetailPage.ts)
 * — full name and phone are the only fields this Page Object drives; the attendee email is
 * pre-filled from the logged-in account and the ticket-count stepper isn't exercised by the
 * single-ticket booking flow the mobile spec follows.
 */
export interface MobileBookingData {
  fullName: string;
  phone: string;
}
