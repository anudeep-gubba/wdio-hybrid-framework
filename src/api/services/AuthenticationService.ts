import { BaseService } from "./BaseService.js";
import { ApiEngine } from "../client/ApiEngine.js";
import { TokenManager } from "../auth/TokenManager.js";

import { LoginRequest } from "../requests/LoginRequest.js";
import { LoginResponse } from "../responses/LoginResponse.js";

import { HttpMethod } from "../types/HttpMethod.js";

import { API_ENDPOINTS } from "../../constants/APIEndpoints.js";

export class AuthenticationService extends BaseService {
  constructor(
    api: ApiEngine,
    private readonly tokenManager: TokenManager,
  ) {
    super(api);
  }

  /**
   * Login user
   */
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.execute<LoginResponse, LoginRequest>({
      method: HttpMethod.POST,
      endpoint: API_ENDPOINTS.AUTH.LOGIN,
      body: credentials,
    });

    this.tokenManager.setToken(response.body.token);

    return response.body;
  }

  /**
   * Clears authentication.
   */
  public logout(): void {
    this.tokenManager.clear();
  }

  /**
   * Returns current access token.
   */
  public getAccessToken(): string {
    return this.tokenManager.getToken();
  }

  /**
   * Indicates whether the user is authenticated.
   */
  public isLoggedIn(): boolean {
    return this.tokenManager.hasToken();
  }
}
