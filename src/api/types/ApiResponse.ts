import { ApiHeaders } from "./ApiHeaders.js";

export interface ApiResponse<TBody = unknown> {
  status: number;

  ok: boolean;

  headers: ApiHeaders;

  duration: number;

  body: TBody;
}
