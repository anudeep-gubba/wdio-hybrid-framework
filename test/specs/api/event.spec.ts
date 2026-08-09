import { expect } from "@wdio/globals";

import { ApiFacade } from "../../../src/api/ApiFacade.js";
import { TestData } from "../../../src/data/index.js";
import { EventData, LoginData } from "../../../src/data/models/index.js";
import { getFutureDateIso } from "../../../src/utils/DateUtils.js";

const eventData = TestData.load<EventData>("eventData");
const loginData = TestData.load<LoginData>("loginData");

describe("API :: Event CRUD", () => {
  it("should login, create, update and delete an event via API @smoke @api", async () => {
    const api = ApiFacade.create();

    const user = loginData.api.validUser;

    // eventDate values in the dataset are static placeholders — always push them into the future
    // at runtime rather than relying on a hardcoded date staying valid.
    const createEventPayload = {
      ...eventData.createEvent,
      eventDate: getFutureDateIso(30, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }),
    };

    const updateEventPayload = {
      ...eventData.updateEvent,
      eventDate: getFutureDateIso(35, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }),
    };

    // --- Login --- (sets the bearer token on ApiFacade's TokenManager; every call below is
    // authenticated automatically via ApiEngine, no token plumbing needed here)
    const loginResponse = await api.service("auth").login({
      email: user.email,
      password: user.password,
    });

    expect(loginResponse.success).toBe(true);
    expect(loginResponse.token).toBeTruthy();

    // --- Create ---
    const createResponse = await api.service("event").createEvent(createEventPayload);

    expect(createResponse.success).toBe(true);
    expect(createResponse.message).toBe("Event created successfully");
    expect(createResponse.data.id).toBeGreaterThan(0);
    expect(createResponse.data.title).toBe(createEventPayload.title);
    expect(createResponse.data.city).toBe(createEventPayload.city);
    // The API returns price as a string — see EventRecord.
    expect(Number(createResponse.data.price)).toBe(createEventPayload.price);

    api.setContextValue("eventId", createResponse.data.id);

    // --- Update ---
    const eventId = api.getContextValue<number>("eventId");

    const updateResponse = await api.service("event").updateEvent(eventId, updateEventPayload);

    expect(updateResponse.success).toBe(true);
    expect(updateResponse.message).toBe("Event updated successfully");
    expect(updateResponse.data.id).toBe(eventId);
    expect(updateResponse.data.title).toBe(updateEventPayload.title);
    expect(updateResponse.data.description).toBe(updateEventPayload.description);
    expect(Number(updateResponse.data.price)).toBe(updateEventPayload.price);

    // --- Delete ---
    const deleteResponse = await api.service("event").deleteEvent(eventId);

    expect(deleteResponse.success).toBe(true);
    expect(deleteResponse.message).toBe("Event deleted successfully");
  });
});
