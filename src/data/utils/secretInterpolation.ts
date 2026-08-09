import { SecretsBag, getSecret } from "../../../config/secretsLoader.js";

const PLACEHOLDER = /^\$\{(.+)\}$/;

/**
 * Recursively walks a loaded dataset and replaces any string value shaped like `${secretKey}`
 * with the real value from the secrets bag (`config/secrets/<env>.secrets.json`). This is the
 * *only* thing a dataset author needs to know: write `${someKey}` exactly like any other value —
 * `email: ${webValidUserEmail}` looks and behaves like `email: invalid@test.com` — no separate
 * field shape, no "secret vs. non-secret" schema, nothing to import or call from a spec. Wired
 * into `BaseDataProvider.load()`, so every dataset (not just `loginData`) gets this for free.
 */
export function interpolateSecrets<T>(data: T, secrets: SecretsBag, environment: string): T {
  if (typeof data === "string") {
    const match = PLACEHOLDER.exec(data);
    return (match ? getSecret(secrets, environment, match[1]) : data) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => interpolateSecrets(item, secrets, environment)) as T;
  }

  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = interpolateSecrets(value, secrets, environment);
    }
    return result as T;
  }

  return data;
}
