import axios, { AxiosInstance, AxiosResponse, RawAxiosResponseHeaders } from "axios";

import { ENV } from "../../../config/envLoader.js";
import { Logger } from "../../utils/Logger.js";
import { RequestResponseAttachment } from "../../reporting/RequestResponseAttachment.js";

import { TokenManager } from "../auth/TokenManager.js";
import { RetryPolicy } from "./RetryPolicy.js";

import { ApiRequest } from "../types/ApiRequest.js";
import { ApiResponse } from "../types/ApiResponse.js";
import { ApiHeaders } from "../types/ApiHeaders.js";
import { HttpMethod } from "../types/HttpMethod.js";

import {
  ApiException,
  AuthenticationException,
  ResourceNotFoundException,
  ServerException,
  ValidationException,
} from "../exception/index.js";

/**
 * WDIO has no equivalent of Playwright's `APIRequestContext` — axios was chosen over `got`
 * because its `validateStatus` hook lets us treat every status code (2xx-5xx) as a normal
 * resolved response, matching how Playwright's request context never throws on non-2xx either.
 * That keeps all status -> exception mapping in one place (`createException` below) instead of
 * split across try/catch branches.
 */
export class ApiEngine {
  private readonly http: AxiosInstance;

  constructor(private readonly tokenManager: TokenManager) {
    this.http = axios.create({
      baseURL: ENV.API_BASE_URL,
      validateStatus: () => true,
    });
  }

  public async execute<TResponse, TRequest = unknown>(
    request: ApiRequest<TRequest>,
  ): Promise<ApiResponse<TResponse>> {
    const start = Date.now();

    const headers = this.buildHeaders(request.headers);

    this.logRequest(request, headers);

    await this.attachRequest(request, headers);

    try {
      const retryPolicy = new RetryPolicy({ maxRetries: request.retries ?? 0 });

      const response = await retryPolicy.execute(async () => this.send(request, headers));

      const duration = Date.now() - start;

      const apiResponse: ApiResponse<TResponse> = {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        headers: this.normalizeHeaders(response.headers),
        duration,
        body: response.data as TResponse,
      };

      this.validateResponse(apiResponse, request);

      await this.attachResponse(apiResponse);

      this.logResponse(apiResponse, request.endpoint, duration);

      return apiResponse;
    } catch (error) {
      Logger.error(
        `[API] ${request.method} ${request.endpoint} failed: ${
          error instanceof Error ? error.stack : String(error)
        }`,
      );

      throw this.handleException(error);
    }
  }

  // -------------------------------------------------------
  // Request Helpers
  // -------------------------------------------------------
  private buildHeaders(customHeaders?: ApiHeaders): ApiHeaders {
    const headers: ApiHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...customHeaders,
    };
    if (this.tokenManager.hasToken()) {
      headers.Authorization = `Bearer ${this.tokenManager.getToken()}`;
    }

    return headers;
  }

  private async send<TRequest>(
    request: ApiRequest<TRequest>,
    headers: ApiHeaders,
  ): Promise<AxiosResponse> {
    return this.http.request({
      url: request.endpoint,
      method: request.method as HttpMethod,
      headers,
      params: request.queryParams,
      data: request.body,
      timeout: request.timeout,
    });
  }

  private normalizeHeaders(headers: RawAxiosResponseHeaders | unknown): ApiHeaders {
    const normalized: ApiHeaders = {};
    Object.entries(headers as Record<string, unknown>).forEach(([key, value]) => {
      normalized[key] = String(value);
    });

    return normalized;
  }

  private async attachRequest(request: ApiRequest, headers: ApiHeaders): Promise<void> {
    await RequestResponseAttachment.attachHeaders(this.redactHeaders(headers));

    await RequestResponseAttachment.attachRequest({
      ...request,
      body: this.redactBody(request.body),
    });
  }

  private async attachResponse<T>(response: ApiResponse<T>): Promise<void> {
    await RequestResponseAttachment.attachResponse({
      ...response,
      body: this.redactBody(response.body),
    });
  }

  private logRequest<TRequest>(request: ApiRequest<TRequest>, headers: ApiHeaders): void {
    Logger.info(`[API] Request -> ${request.method} ${ENV.API_BASE_URL}${request.endpoint}`);
    Logger.debug(`[API] Request headers -> ${JSON.stringify(this.redactHeaders(headers))}`);
    if (request.body !== undefined) {
      Logger.info(
        `[API] Request body -> ${JSON.stringify(this.redactBody(request.body), null, 2)}`,
      );
    }
  }

  private logResponse<TResponse>(
    response: ApiResponse<TResponse>,
    endpoint: string,
    duration: number,
  ): void {
    Logger.info(`[API] Response <- ${endpoint} [${response.status}] ${duration} ms`);
    Logger.debug(`[API] Response headers -> ${JSON.stringify(response.headers)}`);
    Logger.info(
      `[API] Response body -> ${JSON.stringify(this.redactBody(response.body), null, 2)}`,
    );
  }

  private redactHeaders(headers: ApiHeaders): ApiHeaders {
    const safeHeaders = { ...headers };
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = "*****";
    }

    return safeHeaders;
  }

  /**
   * Scrubs sensitive fields (password/token/secret, case-insensitive, one level deep — every
   * request/response body this framework sends is a flat object) before it reaches a log line or
   * an Allure attachment. Only affects what's *logged/attached* — `send()` transmits the real,
   * unredacted `request.body`. Allure results routinely end up as CI artifacts, so a leak there is
   * no safer than a leak in logs/*.log.
   */
  private redactBody(body: unknown): unknown {
    if (!body || typeof body !== "object") {
      return body;
    }

    const redacted: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    for (const key of Object.keys(redacted)) {
      if (/password|token|secret/i.test(key)) {
        redacted[key] = "*****";
      }
    }

    return redacted;
  }

  // -------------------------------------------------------
  // Validation & Exception Handling
  // -------------------------------------------------------

  private validateResponse<TResponse, TRequest>(
    response: ApiResponse<TResponse>,
    request: ApiRequest<TRequest>,
  ): void {
    const expectedStatus = request.expectedStatus;
    if (expectedStatus !== undefined) {
      if (response.status !== expectedStatus) {
        throw this.createException(
          response.status,
          `Expected HTTP ${expectedStatus} but received ${response.status}`,
        );
      }

      return;
    }
    if (response.ok) {
      return;
    }

    throw this.createException(response.status, `Request failed with HTTP ${response.status}`);
  }

  private createException(status: number, message: string): ApiException {
    switch (status) {
      case 400:
        return new ValidationException(message);

      case 401:
      case 403:
        return new AuthenticationException(message);

      case 404:
        return new ResourceNotFoundException(message);

      case 500:
      case 501:
      case 502:
      case 503:
      case 504:
        return new ServerException(status, message);

      default:
        return new ApiException(message, status);
    }
  }

  private handleException(error: unknown): never {
    if (error instanceof ApiException) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiException(error.message, 0);
    }

    throw new ApiException("Unknown API error occurred.", 0);
  }
}
