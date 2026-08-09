import { CreateEventRequest, UpdateEventRequest } from "../../api/requests/EventRequest.js";

export interface EventData {
  createEvent: CreateEventRequest;
  updateEvent: UpdateEventRequest;
}
