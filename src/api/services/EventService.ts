import { BaseService } from "./BaseService.js";
import { ApiEngine } from "../client/ApiEngine.js";

import { CreateEventRequest, UpdateEventRequest } from "../requests/EventRequest.js";
import { DeleteEventResponse, EventResponse } from "../responses/EventResponse.js";

import { HttpMethod } from "../types/HttpMethod.js";

import { API_ENDPOINTS } from "../../constants/APIEndpoints.js";

export class EventService extends BaseService {
  constructor(api: ApiEngine) {
    super(api);
  }

  /**
   * Create an event. Requires an authenticated ApiEngine (bearer token set by a prior
   * `auth` service login — see TokenManager) since the backend requires it.
   */
  public async createEvent(payload: CreateEventRequest): Promise<EventResponse> {
    const response = await this.api.execute<EventResponse, CreateEventRequest>({
      method: HttpMethod.POST,
      endpoint: API_ENDPOINTS.EVENT.CREATE,
      body: payload,
      expectedStatus: 201,
    });

    return response.body;
  }

  /**
   * Update an existing event by id.
   */
  public async updateEvent(id: number, payload: UpdateEventRequest): Promise<EventResponse> {
    const response = await this.api.execute<EventResponse, UpdateEventRequest>({
      method: HttpMethod.PUT,
      endpoint: API_ENDPOINTS.EVENT.UPDATE(id),
      body: payload,
    });

    return response.body;
  }

  /**
   * Delete an event by id.
   */
  public async deleteEvent(id: number): Promise<DeleteEventResponse> {
    const response = await this.api.execute<DeleteEventResponse>({
      method: HttpMethod.DELETE,
      endpoint: API_ENDPOINTS.EVENT.DELETE(id),
    });

    return response.body;
  }
}
