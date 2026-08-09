import { ApiScenarioContext } from "./context/ApiScenarioContext.js";
import { ApiEngine } from "./client/ApiEngine.js";
import { TokenManager } from "./auth/TokenManager.js";
import { createApiServices, ApiServiceMap } from "./services/index.js";

/**
 * WDIO has no Playwright-style fixture injection, so there's no `apiFixture.ts` building this
 * per-test. Specs call `ApiFacade.create()` directly (typically in a `beforeEach`) instead —
 * see test/specs/api/auth.spec.ts.
 */
export class ApiFacade {
  public readonly services: ApiServiceMap;
  public readonly context: ApiScenarioContext;

  private constructor(services: ApiServiceMap, context: ApiScenarioContext) {
    this.services = services;
    this.context = context;
  }

  public static create(): ApiFacade {
    const tokenManager = new TokenManager();
    const apiEngine = new ApiEngine(tokenManager);
    const services = createApiServices(apiEngine, tokenManager);
    const scenarioContext = new ApiScenarioContext();

    return new ApiFacade(services, scenarioContext);
  }

  public setContextValue(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  public getContextValue<T>(key: string): T {
    return this.context.get<T>(key);
  }

  public hasContextValue(key: string): boolean {
    return this.context.has(key);
  }

  public removeContextValue(key: string): void {
    this.context.remove(key);
  }

  public service<T extends keyof ApiServiceMap>(name: T): ApiServiceMap[T] {
    return this.services[name];
  }
}
