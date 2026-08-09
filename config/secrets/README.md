# config/secrets/

Real credentials, API keys, tokens — anything sensitive — live here, never in
`config/environments/*.env` (plain configuration only) or `src/data/datasets/` (committed test
data fixtures).

## Shape

One flat `key -> value` file per environment: `<env>.secrets.json`. Every secret is just a named
string — a login credential is **two** keys (an email key + a password key), not one nested
object, so the same flat shape covers credentials, API keys, tokens, anything else uniformly:

```json
{
  "webValidUserEmail": "anudeep.web@gmail.com",
  "webValidUserPassword": "Test@1234",
  "apiValidUserEmail": "anudeep.api@gmail.com",
  "apiValidUserPassword": "Test@1234",
  "apikeyfordatadog": "dd_xxxxxxxxxxxx"
}
```

## Using a secret in test data — write `${key}`, nothing else

This is the only thing anyone writing a dataset needs to know. In any dataset file
(`src/data/datasets/*/*.{json,yaml,csv,xlsx}`), write `${secretKey}` exactly where you'd otherwise
write a literal value — it looks and behaves like any other value, no separate field, no special
syntax to learn beyond the `${...}`:

```yaml
web:
  validUser:
    email: ${webValidUserEmail} # resolved from config/secrets/<env>.secrets.json
    password: ${webValidUserPassword}

  invalidPassword:
    email: ${webValidUserEmail} # same secret, reused
    password: WrongPassword # a literal — not every value needs to be a secret
```

`BaseDataProvider.load()` (`src/data/providers/BaseDataProvider.ts`) resolves every `${...}`
placeholder in a dataset automatically, for every format (json/yaml/csv/excel) and every dataset,
before a spec ever sees the data — via `src/data/utils/secretInterpolation.ts`. A spec just calls
`TestData.load<T>("fileName")` exactly as it always has:

```ts
const loginData = TestData.load<LoginData>("loginData");
// loginData.web.validUser.email is already the real value — no wrapper call, no import beyond
// TestData itself, nothing spec authors need to do differently for secret vs. non-secret fields.
```

**Don't** write a separate `emailKey`/`passwordKey`-style field, and don't call anything from a
spec to "resolve" a dataset — both existed in an earlier version of this design and were dropped
for exactly this reason: they made secret-bearing fields look different from ordinary ones, and
required every spec to know about it.

## Using a secret outside test data

For something with nothing to do with datasets (e.g. an API key a page object or service needs
directly):

```ts
import { ENV } from "../config/envLoader.js";
import { getSecret } from "../config/secretsLoader.js";

const apiKey = getSecret(ENV.SECRETS, ENV.ENVIRONMENT, "apikeyfordatadog");
```

## Adding a new secret

Add a key to `<env>.secrets.json` (and `<env>.secrets.example.json`, with a placeholder value),
reference it as `${thatKey}` from a dataset (or `getSecret(...)` directly) — that's it, no other
code change. A `${key}` that isn't in the secrets file fails with a specific error naming exactly
which key is missing, not a generic crash — and only datasets/lookups that actually reference a
missing key fail; an api-only test run doesn't need web's keys configured, for example.

## Not committed

`<env>.secrets.json` is gitignored (`.gitignore`: `config/secrets/*.json` /
`!config/secrets/*.secrets.example.json`). Only the `.example` files (placeholder values) are
tracked — copy one to the real filename and fill in real values locally, or populate the real file
from a CI secret / secrets manager (Vault, AWS Secrets Manager, 1Password Connect, …) instead of
hand-editing it, once there are enough secrets/environments to make that worthwhile. Nothing about
how a dataset references a secret (`${key}`) changes either way — only where the file's contents
come from.
