import { ApiEngine } from "../client/ApiEngine.js";
import { TokenManager } from "../auth/TokenManager.js";
import { AuthenticationService } from "./AuthenticationService.js";
import { EventService } from "./EventService.js";

export const createApiServices = (apiEngine: ApiEngine, tokenManager: TokenManager) => {
  return {
    auth: new AuthenticationService(apiEngine, tokenManager),
    event: new EventService(apiEngine),
    // New domains register here — never call ApiEngine directly from a spec.
  } as const;
};

export type ApiServiceMap = ReturnType<typeof createApiServices>;
