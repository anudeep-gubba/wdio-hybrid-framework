import { expect } from "@wdio/globals";

import { ApiFacade } from "../../../src/api/ApiFacade.js";
import { ValidationException } from "../../../src/api/exception/index.js";
import { TestData } from "../../../src/data/index.js";
import { LoginData } from "../../../src/data/models/index.js";

const loginData = TestData.load<LoginData>("loginData");

describe("API :: Auth", () => {
  let api: ApiFacade;

  beforeEach(() => {
    // No fixture injection in WDIO — build the facade directly per test.
    api = ApiFacade.create();
  });

  it("Valid credentials should login and return a bearer token @smoke @api", async () => {
    const user = loginData.api.validUser;

    const loginResponse = await api.service("auth").login({
      email: user.email,
      password: user.password,
    });

    expect(loginResponse.success).toBe(true);
    expect(loginResponse.token).toBeTruthy();
    expect(loginResponse.user.email).toBe(user.email);

    api.setContextValue("authToken", loginResponse.token);

    expect(api.getContextValue<string>("authToken")).toBe(loginResponse.token);
    expect(api.service("auth").isLoggedIn()).toBe(true);
  });

  it("Invalid credentials should raise ValidationException @regression @api", async () => {
    // This backend responds 400 (not 401) for a bad password — ApiEngine.createException()
    // maps that to ValidationException, exercising the same non-2xx -> typed-exception path
    // AuthenticationException/ResourceNotFoundException/ServerException also go through.
    let thrown: unknown;

    try {
      await api.service("auth").login({
        email: loginData.api.validUser.email,
        password: "clearly-wrong-password",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ValidationException);
    expect((thrown as ValidationException).status).toBe(400);
  });
});
