import { ApiHeaders } from "./ApiHeaders.js";
import { ApiQueryParams } from "./ApiQueryParams.js";
import { HttpMethod } from "./HttpMethod.js";

export interface ApiRequest<TBody = unknown> {
  method: HttpMethod;

  endpoint: string;

  body?: TBody;

  headers?: ApiHeaders;

  queryParams?: ApiQueryParams;

  timeout?: number;

  retries?: number;

  expectedStatus?: number;
}
