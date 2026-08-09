export interface EventRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  // The API returns price as a string (e.g. "1500"), not a number — verified against the live
  // response, not assumed. Convert with Number(...) when asserting on it.
  price: string;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string;
  isStatic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventResponse {
  success: boolean;
  data: EventRecord;
  message: string;
}

// DELETE's response has no `data` — separate shape rather than a partial EventResponse.
export interface DeleteEventResponse {
  success: boolean;
  message: string;
}
