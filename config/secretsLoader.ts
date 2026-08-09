import fs from "fs";
import path from "path";

/**
 * A flat `key -> value` bag — every secret is just a named string, whether it's a credential
 * field ("webValidUserEmail") or something with no natural pairing ("apikeyfordatadog"). Login
 * credentials are two secrets (an email key + a password key), not one object, so the same flat
 * shape covers both without a special case.
 */
export type SecretsBag = Record<string, string>;

/**
 * `.env` is for plain configuration (URLs, timeouts, device names) — not secrets. Anything
 * sensitive (user credentials today; API keys/tokens/whatever else later) lives in its own file,
 * `config/secrets/<env>.secrets.json`, structured JSON rather than crammed into one `.env` line.
 * That file is gitignored; `config/secrets/<env>.secrets.example.json` is the tracked template.
 *
 * Missing file -> `{}`, not a throw — a fresh clone with no secrets configured yet should only
 * fail once something actually asks for a specific key it needs (see `getSecret()` below), with
 * an error naming that key, not a blanket "secrets file missing" crash at import time.
 */
export function loadSecrets(environment: string): SecretsBag {
  const filePath = path.resolve(process.cwd(), "config", "secrets", `${environment}.secrets.json`);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as SecretsBag;
  } catch (error) {
    throw new Error(
      `config/secrets/${environment}.secrets.json is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

/**
 * Looks up one key in an already-loaded secrets bag, throwing a specific, actionable error if
 * it's missing rather than returning `undefined` and letting a caller fail confusingly later.
 */
export function getSecret(secrets: SecretsBag, environment: string, key: string): string {
  const value = secrets[key];
  if (value === undefined) {
    throw new Error(
      `Secret "${key}" is not defined. Add it to config/secrets/${environment}.secrets.json ` +
        `(see config/secrets/${environment}.secrets.example.json for the shape).`,
    );
  }

  return value;
}
