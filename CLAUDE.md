# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A hybrid WebdriverIO automation framework covering **Web** + **API** for EventHub
(`https://eventhub.rahulshettyacademy.com`) and **Mobile** for a separate native app (Sauce Labs'
"Swag Labs" demo app, `apps/swaglabs.apk`/`apps/swag.app`), through distinct layered architectures
that share a common test-data and reporting foundation. TypeScript, `strict` mode, CommonJS/NodeNext
module resolution.

It's the WebdriverIO sibling of a Playwright framework at `../playwright-framework` — same layered
shape (page objects / components / validators / API facade / data providers / constants), adapted
to WDIO's object model. Where the two frameworks solve the same problem differently, it's because
WDIO has no fixture injection and no built-in HTTP client — see "Where this deliberately differs
from Playwright" below.

**What's under test for mobile is a `config/environments/<env>.env` setting, not something hardcoded
in a config file** — see "Mobile is a native app" below for the current target, the priority order
between a fresh install vs. an already-installed app vs. mobile web, and why mobile has changed
target twice already as real app files became available.

## Commands

```bash
npm run test:web         # web UI tests       -> wdio run config/wdio.web.conf.ts
npm run test:api         # API tests          -> wdio run config/wdio.api.conf.ts
npm run test:android     # Android Chrome UI  -> wdio run config/wdio.android.conf.ts
npm run test:ios         # iOS Safari UI      -> wdio run config/wdio.ios.conf.ts
npm run test:all         # web -> api -> android -> ios, sequentially
npm run test:parallel    # web + api + android + ios, concurrently (see "Parallel execution" below)
npm run smoke            # web tests tagged @smoke (--mochaOpts.grep)
npm run typecheck        # tsc --noEmit
npm run lint             # eslint . (npm run lint:fix to auto-fix)
npm run format:check     # prettier --check . (npm run format to auto-fix)
npm run allure-report    # generate + open the Allure report from allure-results/
npm run data:build-excel # regenerate src/data/datasets/excel/*.xlsx from the matching *.csv
```

CI (`.github/workflows/ci.yml`) runs `lint`/`format:check`/`typecheck` plus `test:web`/`test:api` on
every push/PR; a `test:android`-via-BrowserStack job exists but is off by default — see "CI/CD,
linting, and BrowserStack" below for what it needs before it'll actually run.

Run a single spec file or a test by name with WDIO's own filters:

```bash
npx wdio run config/wdio.web.conf.ts --spec test/specs/web/login.spec.ts
npx wdio run config/wdio.web.conf.ts --mochaOpts.grep "Valid user should login"
```

Target a specific environment / data format via env vars (defaults: `TEST_ENV=qa`, format from that
env file):

```bash
TEST_ENV=dev npm run test:web
LOG_LEVEL=debug npm run test:api
```

**Mobile prerequisites** — `services: ["appium"]` (in `wdio.shared.conf.ts`) needs `appium` as a
**local** `devDependency`, not just a global install (`@wdio/appium-service` looks for
`node_modules/appium`; a global-only install fails at `onPrepare` with "Appium is not installed
locally"). This project's local `appium` has its **own separate driver registry**
(`node_modules/.cache/appium`) — a globally-installed `appium` with drivers already on it does
**not** cover this project; drivers must be installed again here: `npx appium driver install
uiautomator2`, `npx appium driver install xcuitest`. Verify with
`npx appium driver list --installed` (run with `npx` — plain `appium driver list` checks the global
install's registry, which is a different one). Android also needs `adb` on `PATH`
(`$ANDROID_HOME/platform-tools`) with at least one running emulator/device (`adb devices`); iOS
needs a booted simulator (`xcrun simctl list devices booted`) — `@wdio/appium-service` dispatches
sessions to whatever's already running, it doesn't boot anything itself.
`connectionRetryTimeout: 5 * 60 * 1000` in `wdio.shared.conf.ts` exists because first-run iOS
sessions compile WebDriverAgent via Xcode, which alone can exceed WDIO's 120s default. Run
`npm run test:ios` **interactively once** before relying on it in CI/scripted runs — a first build
can also block on a one-time Xcode/Simulator trust or code-signing prompt that a non-interactive
process can't answer, which looks like a hang (near-zero CPU, `xcodebuild` alive but not
progressing) rather than a clean failure. Subsequent runs reuse the compiled WDA and are fast.

Environment files live in `config/environments/<name>.env` (`qa`, `dev`) and are loaded by
`config/envLoader.ts` into the frozen `ENV` object, keyed off `process.env.TEST_ENV`. Required keys
(`BASE_URL`, `API_BASE_URL`, `TEST_DATA_FORMAT`) throw at `envLoader` import time if missing.
`TEST_DATA_FORMAT` (`json`|`yaml`|`csv`|`excel`) selects which dataset provider `TestData.load()` uses.

## Architecture

The codebase enforces a hard split between **UI** (web + mobile) and **API** test layers — they must
not import each other's page objects/services except in explicit hybrid flows.

### UI layer (Page Object Model) — Web and Mobile

Flow: `test/specs/web|mobile/*.spec.ts` → page object (`new LoginPage()`, no fixture injection) →
`src/pages/web|mobile/*.ts` (extends `BasePage`) → `src/components/*` (extends `BaseComponent`, wraps
a WDIO `ChainablePromiseElement`) → `src/locators/web|mobile/*.ts`. Web and mobile are **different
apps** (EventHub vs. the Swag Labs demo app) with their own page objects and locators — they only
share the layers below that: `BasePage`, `BaseComponent`/components, `LoginValidator`, reporting.
(This wasn't always true — when mobile meant driving EventHub through a mobile browser, web and
mobile genuinely shared one `LoginPage`. See "Mobile is a native app" below for that history.)

- `src/pages/BasePage.ts` — shared navigation/assertion primitives (`navigate`, `verifyUrl`,
  `verifyTitle`, `waitForLoad`), wrapping WDIO's `browser` global. Page objects extend this and
  compose components; they must not contain assertions or business rules (those belong in
  `src/validators/*.ts`). Native mobile's `waitForLoad` override waits for the login button instead
  of a URL, since there's no navigation/URL concept in a native app.
- `src/components/` — `Button`, `TextBox`, `CheckBox`, `Label` wrap a `ChainablePromiseElement` via
  `BaseComponent` (`isVisible`/`isEnabled`/`isDisabled`/`scrollIntoView`/`getElement()`). Page
  objects build UI actions from these rather than calling `$()`/`$$()` inline. WDIO's `$()`/element
  API is identical for a browser session and a native-app Appium session, so this layer is shared
  even though web and mobile no longer share page objects/locators above it.
- `src/validators/LoginValidator.ts` — static assertion helpers keep `expect(...)` calls out of page
  objects and specs: `expectLoginFailed`/`expectLoginSuccess` for web, `expectMobileLoginFailed`/
  `expectMobileLoginSuccess` for native mobile (different apps, different success/failure signals —
  URL change vs. a specific screen element appearing).
- `src/reporting/AllureHelper.ts` — wrap logical UI actions in `AllureHelper.step(name, fn)` for
  step-level Allure reporting (see `LoginPage.login` in both `src/pages/web/` and
  `src/pages/mobile/`).

### API layer (service-based)

Flow: `test/specs/api/*.spec.ts` → `ApiFacade.create()` (built directly in the spec — see "Where
this deliberately differs from Playwright") → `src/api/ApiFacade.ts` → `src/api/services/*.ts` →
`src/api/client/ApiEngine.ts` → axios → `https://api.eventhub.rahulshettyacademy.com/api`.

- Specs never call axios (or any HTTP client) directly — everything goes through
  `api.service("<name>")` methods (`auth` — login; `event` — create/update/delete, see
  `EventService`; register new domains in `src/api/services/index.ts`).
- `ApiFacade` also exposes scenario-scoped state: `setContextValue()`/`getContextValue()`/
  `hasContextValue()`/`removeContextValue()`, backed by `src/api/context/ApiScenarioContext.ts`. Use
  this instead of local variables to carry values (auth token, created resource id) between steps in
  the same test — see `test/specs/api/event.spec.ts`, which threads the id from `createEvent()`
  through to `updateEvent()`/`deleteEvent()` this way.
- `src/api/client/ApiEngine.ts` builds headers, executes the request via axios (see "Where this
  deliberately differs from Playwright" for why axios), attaches request/response data for Allure
  reporting (`src/reporting/RequestResponseAttachment.ts`), and converts non-2xx responses into typed
  exceptions from `src/api/exception/*.ts` (`AuthenticationException` 401/403,
  `ValidationException` 400 — this backend returns 400, not 401, for bad login credentials, see
  `test/specs/api/auth.spec.ts` — `ResourceNotFoundException` 404, `ServerException` 5xx). Axios is
  configured with `validateStatus: () => true` so every status code reaches this single mapping path
  instead of being split across try/catch branches.
- `src/api/client/RetryPolicy.ts` — generic `execute<T>(operation, shouldRetry?)` retry wrapper used
  by the engine for flaky calls; framework-agnostic, no axios/WDIO coupling.
- `src/api/auth/TokenManager.ts` — holds the bearer token set after `auth` service login; consumed by
  `ApiEngine` for authenticated requests.
- New endpoints: add typed request/response shapes in `src/api/requests/`/`src/api/responses/`, add
  the path (relative to `API_BASE_URL`, which already ends in `/api`) to
  `src/constants/APIEndpoints.ts`, add/extend a service method — never hardcode endpoint strings in a
  test.

### Test data

`src/data/TestData.ts` is the single entry point: `TestData.load<T>("fileName")` picks a provider via
`src/data/factory/DataProviderFactory.ts`, keyed on `ENV.TEST_DATA_FORMAT`. Providers
(`JsonProvider`/`YamlProvider`/`CsvProvider`/`ExcelProvider`, all implementing `IDataProvider`) read
from `src/data/datasets/<format>/*.<ext>` (`json`, `yaml`, `csv`, `excel` → `.xlsx`) — the same
logical dataset must exist in every format.

`JsonProvider`/`YamlProvider` parse the file's native nested structure directly. `CsvProvider`/
`ExcelProvider` instead read flat `key,value,type` rows (header required) — `key` is a dot-path (e.g.
`mobile.validUser.username`), `type` is optional and one of `string` (default) | `number` |
`boolean`. Both are rebuilt into the same nested shape via `unflattenRows` in
`src/data/utils/tabularData.ts`, so all four formats produce identical objects and the same data
models work unchanged. Always set an explicit `type` for non-string values — CSV/Excel values are
otherwise treated as strings, unlike JSON/YAML where numeric/boolean types are implicit. Run
`npm run data:build-excel` after editing a `.csv` fixture to regenerate the matching `.xlsx` so they
never drift.

Current dataset: `loginData.{json,yaml,csv,xlsx}` + `src/data/models/LoginData.ts`:

```ts
{
  web:    { validUser: User, invalidPassword: User, invalidEmail: User }
  api:    { validUser: User }
  mobile: { validUser, invalidPassword }   // MobileUser { username, password } — Swag Labs seed accounts
}
```

Every field is a plain value — `TestData.load<LoginData>("loginData")` alone returns real, usable
credentials, no wrapper call needed by a spec. `mobile` uses `MobileUser` (`src/models/MobileUser.ts`)
— `standard_user`/`secret_sauce`, one of the Swag Labs app's own fixed seed accounts (local to each
app instance, no shared backend session, _publicly documented_ by Sauce Labs), so those are written
as plain literals directly in the dataset. `web`/`api`'s real EventHub credentials are **never**
literals in this dataset — see "Real secrets never live in `.env` or committed fixtures" below for
how `${webValidUserEmail}`-style placeholders resolve to them automatically.

Second dataset: `eventData.{json,yaml,csv,xlsx}` + `src/data/models/EventData.ts` — `{ createEvent,
updateEvent }`, both typed as `CreateEventRequest`/`UpdateEventRequest` (`src/api/requests/
EventRequest.ts`) so the payload shape stays in sync with the service layer. `eventDate` in the
dataset is a static placeholder; `test/specs/api/event.spec.ts` overwrites it at runtime via
`getFutureDateIso()` rather than relying on a hardcoded date staying in the future forever.

When adding a new dataset, add the file for every supported format, add a typed model in
`src/data/models/`, and export it from `src/data/models/index.ts`.

#### Real secrets never live in `.env` or committed fixtures

`config/environments/*.env` is plain configuration (URLs, timeouts, device names) — no credentials,
API keys, or tokens belong there. Real values live in a **dedicated secrets file**, and a dataset
references one with `${secretKey}` written exactly where a literal value would otherwise go — see
`config/secrets/README.md` for the full picture (including why an earlier version of this used a
separate `emailKey`/`passwordKey` field shape and a `withRealCredentials()` wrapper every spec had
to call, and why both were dropped); summary:

- `config/secrets/<env>.secrets.json` (gitignored) — a **flat** `key -> value` bag
  (`config/secretsLoader.ts`'s `SecretsBag`), loaded once into `ENV.SECRETS` (`config/envLoader.ts`).
  Flat and generic on purpose: a login credential is _two_ keys (an email key + a password key), not
  one nested object, so the exact same shape covers credentials, API keys, tokens — anything
  sensitive — without a special case per secret type.
- **A dataset author writes `${key}` as a value, nothing else** — e.g.
  `"email": "${webValidUserEmail}"` right alongside `"password": "WrongPassword"` in the very same
  object, identical shape either way (see `src/data/datasets/*/loginData.*`). No separate field name
  for "this one's a secret", no import, no function to call from a spec.
- `src/data/utils/secretInterpolation.ts`'s `interpolateSecrets()` recursively resolves every
  `${...}` placeholder in a loaded dataset against `ENV.SECRETS`, wired into
  `src/data/providers/BaseDataProvider.ts`'s `load()` — the one method all four providers
  (json/yaml/csv/excel) share. This means **every** dataset gets placeholder resolution for free,
  not just `loginData`, and a spec's `TestData.load<T>("fileName")` call is completely unchanged
  from before secrets existed — verified live that YAML in particular parses `${...}` as a plain
  string and not flow-mapping syntax (`{`/`}` are otherwise special in YAML).
- Resolution happens once per dataset file, at load time — so it's whichever secret keys the _whole
  file_ references that must be configured, not just the ones a given spec happens to touch (a
  trade-off for "zero code in specs"; the previous getter-based lazy design avoided this but
  required a wrapper call in every spec instead).
- Adding a user (or any other secret) is a two-key addition to `<env>.secrets.json` and a `${key}`
  reference in a dataset — never a code change. For real scale, populate that file from a CI secret
  / secrets manager (Vault/AWS Secrets Manager/1Password Connect) instead of hand-editing it;
  `getSecret()`'s lookup code doesn't change either way, only where the file's contents come from.
- `<env>.secrets.json` is gitignored; `<env>.secrets.example.json` (placeholder values) is the
  tracked template — copy one to the real filename and fill in real values locally, or populate the
  real file from CI/a secrets manager instead of committing it.
- A missing key fails loudly and specifically (`getSecret()` throws `Secret "X" is not defined. Add
it to config/secrets/<env>.secrets.json...`) rather than silently loading `undefined` — verified
  live (temporarily emptied the secrets file, confirmed the exact missing key is named, then
  restored it and confirmed a normal run recovers).
- `src/api/client/ApiEngine.ts`'s `redactBody()` scrubs `password`/`token`/`secret`-named fields
  (case-insensitive) from what reaches `Logger`/Allure attachments — verified live in
  `logs/execution.log` (`"password": "*****"`, `"token": "*****"`) — but this only protects
  _logged/attached_ data; `send()` transmits the real, unredacted body. This is independent of the
  secrets-file design above — it protects credentials in transit/observability, not at rest.

### Shared building blocks

- `src/utils/Logger.ts` — Winston-based logger used by all three layers; logs to `logs/*.log`.
  Prefer this over `console.log`.
- `src/utils/DateUtils.ts` — date helpers (e.g. `getFutureDateIso`) for building relative test-data
  timestamps at runtime rather than hardcoding dates.
- `src/constants/` — barrel-exported (`src/constants/index.ts`) global constants: `AppRoutes` (web
  routes), `API_ENDPOINTS` (API paths, relative to `API_BASE_URL`), `Messages` (expected copy for
  assertions), `TestTags` (`@smoke`, `@regression`, etc., usable with `--mochaOpts.grep`).
- `src/reporting/` — `AllureHelper` (step wrapping via `@wdio/allure-reporter`'s static `step()`),
  `AttachmentHelper`, `RequestResponseAttachment` (API req/res attached to the Allure report).
- `config/wdio.shared.conf.ts` — cross-cutting `beforeTest`/`afterTest` hooks (test start/end
  logging) shared by every platform config, plus `waitforTimeout: ENV.EXPECT_TIMEOUT` (backs
  expect-webdriverio's polling — bumped past WDIO's 3s default because the real backend's error toast
  can take a couple seconds to render; see `LoginPage.getErrorMessage()`). This is where
  fixture-level before/after logic would live in a Playwright framework; WDIO has no fixtures, so it
  lives in the test-runner lifecycle hooks instead.

### Mobile is a native app — the Sauce Labs "Swag Labs" demo app

`test/specs/mobile/login.spec.ts` drives `src/pages/mobile/LoginPage.ts`, a real native-app page
object, against `apps/swaglabs.apk` (Android) / `apps/swag.app` (iOS) — `com.swaglabsmobileapp` /
`com.saucelabs.SwagLabsMobileApp`. This is the framework's **second** mobile target, not the first:
it went placeholder-native-scaffolding → mobile-web (EventHub, via Chrome/Safari) → this, as real
app files became available at each stage. See git history / earlier design notes in this file's
history if you need the mobile-web version back — reusing `src/pages/web/LoginPage.ts` against a
mobile browser session is a small, well-understood change (swap `resolveAndroidTarget()`'s priority,
no `ANDROID_APP_PATH`/`ANDROID_APP_PACKAGE` set) — but don't keep both wired up as parallel "mobile"
specs at once: exactly one target is ever active per env config, and a spec for the _other_ one will
just fail every run, which is worse than not having it.

- **What's under test is decided entirely by `config/environments/<env>.env`, never by editing
  `wdio.android.conf.ts`/`wdio.ios.conf.ts`.** `resolveAndroidTarget()`/`resolveIosTarget()` in
  `config/mobileCapabilityBuilder.ts` pick, in priority order:
  1. `ANDROID_APP_PATH` / `IOS_APP_PATH` — install+launch this `.apk`/`.app` fresh. **Wins if both
     this and (2) are set** — a fresh emulator/simulator has nothing pre-installed, so package/
     activity or bundle id alone (no install step) would fail there; an artifact both installs and
     launches, so it's the safer default whenever one is available.
  2. `ANDROID_APP_PACKAGE` + `ANDROID_APP_ACTIVITY` (Android) / `IOS_BUNDLE_ID` (iOS) — launch an app
     **already installed** on the device (no artifact needed — the common case for CI images with
     the app pre-baked in).
  3. Neither set → mobile web (`browserName: "Chrome"` / `"Safari"`).
     Currently `qa.env` sets _both_ (1) and (2) for Android/iOS — (1) wins, per above.
- **Locators (`src/locators/mobile/LoginPageLocators.ts`) were verified live, not guessed** — a
  scratch spec dumped `browser.getPageSource()` on a booted iOS simulator after a real login
  attempt (valid and invalid) to read the actual accessibility ids
  (`~test-Username`/`~test-Password`/`~test-LOGIN`/`~test-Error message`/`~test-PRODUCTS`) and the
  actual error copy off the real screen, the same way `src/locators/web/LoginPageLocators.ts` was
  verified against real rendered HTML earlier. **Confirmed on iOS only** — no Android emulator was
  booted at verification time. This app is React Native and typically exposes the same testID as the
  accessibility id on both platforms, so these are expected to hold on Android unchanged, but that's
  an expectation, not something this session verified — check the first Android run's actual result
  rather than assuming.
- **App state resets between tests via `browser.reloadSession()`** (`login.spec.ts`'s `beforeEach`).
  Both tests share one app session per device (`wdio:maxInstances: 1` per capability), and a
  successful login leaves the app on the products screen — a login test running right after it would
  find no login form. `reloadSession()` relaunches the app fresh before every test rather than
  depending on test order for isolation.
- **Credentials are the app's own fixed seed accounts** (`standard_user`/`secret_sauce`, per
  `src/data/datasets/*/loginData.*`'s `mobile` section — see `MobileUser` in `src/models/`), local to
  each app instance with no shared backend session — unlike `web`/`api`'s real EventHub accounts,
  there's no reason to use different credentials per platform/device here, so there's only one
  `mobile.validUser`/`mobile.invalidPassword`, not a per-platform split.

**Also verified live** against two booted iOS simulators earlier while this suite was still
mobile-web (single-device and `IOS_UDIDS` parallel, both passing), which surfaced bugs worth knowing
if mobile-web ever comes back or similar symptoms show up here:

- A relative `browser.url(...)` needs `baseUrl` set on the mobile configs too, not just
  `wdio.web.conf.ts` — irrelevant to the current native suite (no navigation-by-URL at all), but
  `wdio.android.conf.ts`/`wdio.ios.conf.ts` still set it, harmlessly, in case mobile-web returns.
- Reading a status/error label's text right after triggering it can race the async render — poll the
  actual text (`browser.waitUntil` on non-empty `.text()`) rather than the element's `isVisible()`,
  which isn't a reliable "has content yet" signal on every driver (confirmed: an empty container
  reports displayed on iOS Safari/XCUITest but not on desktop Chrome). `LoginPage.getErrorMessage()`
  in **both** the web and native mobile page objects does this.
- `IOS_UDIDS` parallel runs looked concurrent (both worker processes logged "RUNNING" at the same
  moment) but timestamps showed worker 1's session/tests didn't actually start until worker 0's had
  _fully finished_ — real serialization, not just a misleading log interleave. Root cause: both
  devices' WebDriverAgent builds pointed at the same default Xcode `DerivedData` folder, and Xcode's
  build lock serializes concurrent `xcodebuild` invocations against one folder. Fixed with a unique
  `appium:derivedDataPath` per device index (`wdio.ios.conf.ts`'s `extraCapabilitiesForIndex`) —
  confirmed after the fix that both workers' tests start within a few seconds of each other and the
  combined run (including a cold WDA build for both) takes about as long as one build, not two.
  **Don't add `appium:usePrebuiltWDA: true` alongside a fresh per-device `derivedDataPath`** — tried
  it expecting a speed-up; it instead assumes a build already exists at that path and fails outright
  (`xcodebuild` exit 65) on a first run into an empty one. Appium already auto-detects and reuses an
  existing build at a given `derivedDataPath` without that capability.

### Parallel execution (web and mobile)

Single-device/single-instance is the default everywhere; parallel is opt-in via env vars, not a
code change.

- **Web** — `wdio.web.conf.ts` sets `maxInstances: ENV.WEB.MAX_INSTANCES` (`WEB_MAX_INSTANCES` env
  var, default 2). With more than one spec file under `test/specs/web/`, WDIO's local runner fans
  them out across that many concurrent Chrome sessions. `WEB_MAX_INSTANCES=1` forces serial.
- **Mobile** — driven by `ANDROID_UDIDS`/`IOS_UDIDS` (comma-separated), parsed in `envLoader.ts` into
  `ENV.MOBILE.ANDROID.UDIDS`/`ENV.MOBILE.IOS.UDIDS`. `config/mobileCapabilityBuilder.ts` turns that
  into the `capabilities` array both `wdio.android.conf.ts` and `wdio.ios.conf.ts` use:
  - empty (default) → one capability, addressed by `ANDROID_DEVICE_NAME`/`IOS_DEVICE_NAME` — a
    single-device run.
  - `"udid1,udid2,..."` → one capability per UDID, each pinned to its own
    `appium:systemPort`(Android)/`appium:wdaLocalPort`(iOS) so concurrent UiAutomator2/XCUITest
    sessions on the same host don't collide on a port, and each capped at `wdio:maxInstances: 1` so
    a device is never double-booked. The config's overall `maxInstances` is set to
    `capabilities.length`, so device count alone controls the parallelism — no other file needs
    editing. Devices/emulators/simulators must already be booted (`adb devices` /
    `xcrun simctl list devices booted`) — `@wdio/appium-service` starts one Appium server, which
    dispatches sessions to whatever's already running rather than booting anything itself.
    **On iOS specifically**, a distinct port alone isn't enough for genuine concurrency — each
    device also gets its own `appium:derivedDataPath` (`wdio.ios.conf.ts`), or their WebDriverAgent
    builds contend for Xcode's shared `DerivedData` lock and silently serialize despite looking
    parallel in the logs (verified live — see "Mobile is a native app" above for what that
    looked like and how it was confirmed fixed).
- **Web and mobile running at the same time** — `npm run test:parallel` runs `test:web`, `test:api`,
  `test:android`, and `test:ios` concurrently via `concurrently` (each as its own `wdio run` process,
  invoked directly rather than through `npm run test:web` etc. — see below for why). `test:all`
  still runs the same four sequentially, for predictable, non-interleaved CI logs; `test:parallel` is
  for local iteration speed. Each platform's own failures don't kill the others (`concurrently`
  doesn't kill siblings on a non-zero exit by default), and the overall command's exit code reflects
  whether _any_ platform failed.
  - **Why `test:parallel` calls `wdio run ...` directly instead of `npm run test:web` /
    `npm run test:android` / etc.:** those per-platform scripts each carry their own
    `pretest:<name>` hook (`rm -rf allure-results`) for when they're run solo. Four of those firing
    at once would race — one platform's startup could delete another's in-flight results. So
    `test:parallel` has exactly one `pretest:parallel` hook that clears `allure-results/` once,
    before any of the four `wdio run` processes start; from there, parallel `@wdio/allure-reporter`
    writers safely coexist in one `allure-results/` folder (each result file is independently
    UUID-named — this is the same mechanism Allure uses to merge results from any multi-worker run).

## CI/CD, linting, and BrowserStack

### TypeScript is pinned to 6.0.3, not the ^7 line — deliberately

`typescript-eslint` (the linter's TS support) doesn't support TypeScript 7.0 yet (a very new
native-compiler preview release — `typescript-eslint`'s peer range is `>=4.8.4 <6.1.0`) — confirmed
by actually trying to lint with TS 7 installed and hitting `typescript-eslint does not support TS
7.0` immediately, not by reading a changelog. Downgraded to `6.0.3`, the newest stable release still
in range, and reconfirmed `tsc --noEmit` passes identically at that version. If TypeScript is ever
bumped again, check `npm view typescript-eslint peerDependencies` first — this isn't a one-time fix,
it's a constraint that'll recur with any TS major bump ahead of the linting ecosystem's support.

### ESLint + Prettier

`eslint.config.js` (flat config) + `.prettierrc.json`. One real bug worth knowing about if the
config ever gets restructured: `js.configs.recommended`/`tseslint.configs.recommended` **must** be
scoped under `files: ["**/*.ts"]`, not applied at the top level — applied globally, TypeScript-only
rules like `@typescript-eslint/no-require-imports` also flag `scripts/*.js` and `eslint.config.js`
itself, both plain CommonJS Node scripts that are supposed to use `require()`. Caught this by
actually running `npx eslint .` and seeing it flag the config's own `require()` calls, not by
reasoning about it in advance.

`npm run lint` / `lint:fix` / `format` / `format:check`. Both are wired into
`.github/workflows/ci.yml`'s `lint-and-typecheck` job, which every other job depends on
(`needs: lint-and-typecheck`).

### CI (`.github/workflows/ci.yml`)

Four jobs: `lint-and-typecheck` (always), `web` and `api` (self-contained, run on any
`ubuntu-latest` runner — Chrome is preinstalled), `mobile-browserstack` (gated off by default, see
below). `web`/`api` each write their own `config/secrets/qa.secrets.json` from repo secrets before
running — least-privilege (the `web` job only gets web credentials, not api/BrowserStack ones) and
via `env:` + `JSON.stringify` rather than string-interpolating a secret into a shell heredoc, which
would silently break (or worse, generate malformed JSON) if a secret ever contained a `"` or `\` —
verified this handles that correctly with deliberately adversarial test values before committing to
it. Requires these configured under repo Settings → Secrets and variables → Actions:
`WEB_VALID_USER_EMAIL`, `WEB_VALID_USER_PASSWORD`, `API_VALID_USER_EMAIL`, `API_VALID_USER_PASSWORD`.

**What's actually verified vs. not:** the YAML was validated for correct structure (parsed with the
project's own `yaml` dependency, confirmed job names/keys) and the secrets-writing logic was
verified locally (including with adversarial special characters). What was **not** verified is an
actual GitHub Actions run — this environment has no access to execute a real workflow, so treat the
workflow as carefully-written-but-unexecuted until it's actually run once in GitHub.

### BrowserStack App Automate (mobile device farm)

`MOBILE_EXECUTION_TARGET=browserstack` (`config/environments/<env>.env`, default `local`) switches
`wdio.android.conf.ts`/`wdio.ios.conf.ts` from a local Appium server + emulator/simulator to
BrowserStack's cloud devices — see each file's `buildBrowserStackConfig()`. Uses the official
`@wdio/browserstack-service`, not a hand-rolled hub connection: its `app` service option (a local
file path) uploads the `.apk`/`.ipa` automatically, so there's no separate manual upload step or
`appium:app` capability to set by hand.

- `BROWSERSTACK_ANDROID_DEVICES`/`BROWSERSTACK_IOS_DEVICES` — `"DeviceName@OSVersion,DeviceName2@..."`
  (`config/browserstackCapabilityBuilder.ts`'s `parseBrowserStackDevices()`), same single-vs-parallel
  pattern as `ANDROID_UDIDS`/`IOS_UDIDS` for local execution, but BrowserStack allocates/queues
  devices itself — no per-device port or `derivedDataPath` juggling needed here, unlike the local
  path.
- **Credentials (`browserstackUsername`/`browserstackAccessKey`) come from
  `config/secrets/<env>.secrets.json` only** — read directly via `getSecret()` in
  `wdio.android/ios.conf.ts`, never from `.env`, same rule as every other secret in this framework.
  Not yet in the real (gitignored) secrets files — `getSecret()` will throw a clear "not defined"
  error naming the missing key if BrowserStack mode is selected before they're added.
- BrowserStack mode always requires `ANDROID_APP_PATH`/`IOS_APP_PATH` — "already installed" doesn't
  meaningfully apply to BrowserStack's ephemeral cloud devices the way it does a persistent local
  emulator, so `ANDROID_APP_PACKAGE`+`ANDROID_APP_ACTIVITY`/`IOS_BUNDLE_ID` alone aren't enough here
  even though they are for local execution. Throws a specific config-load-time error if missing —
  verified live (temporarily faked BrowserStack credentials and toggled the app path on/off,
  confirmed both the successful single-device/parallel capability construction and the missing-path
  error message).
- **iOS real-device caveat**: BrowserStack's real-device cloud needs a signed `.ipa`, not an
  iOS-_simulator_ `.app` bundle — `apps/swag.app` in this repo is a simulator build (see
  `apps/README.md`) and will not install on a physical device. That's a build/signing concern
  outside this framework's control, not something pointing `IOS_APP_PATH` at the right file solves.
- **Two things this framework cannot supply on its own**, both called out directly in
  `.github/workflows/ci.yml`'s `mobile-browserstack` job (gated behind the `BROWSERSTACK_ENABLED`
  repo variable so a fresh clone/fork doesn't fail this job by default): (1) real BrowserStack
  credentials — none were available in this session, so `config/secrets/*.secrets.json` has no
  `browserstackUsername`/`browserstackAccessKey` entries, only the `.example` files document the
  expected keys; (2) a way to fetch the app binary in CI, since `apps/` is gitignored and never
  reaches a fresh checkout — the workflow has a placeholder "Fetch app build" step (that deliberately
  exits 1 until replaced) showing the shape of what's needed, not a working implementation, because
  this repo has no actual artifact-distribution mechanism to plug in. **Neither of these could be
  verified against a real BrowserStack run in this session** — the capability-building code was
  verified as thoroughly as possible without one (dry-run capability construction, both single- and
  parallel-device, plus the error paths), but an actual BrowserStack session was not.

## Where this deliberately differs from Playwright

- **No fixture injection.** Playwright's `test.extend()` injects page objects/API facades into each
  test function. WDIO has nothing equivalent, so page objects and `ApiFacade` are plain classes,
  instantiated directly in a spec's `beforeEach` (see `test/specs/web/login.spec.ts` and
  `test/specs/api/auth.spec.ts`). Cross-cutting setup that Playwright would put in a fixture instead
  lives in `wdio.shared.conf.ts`'s lifecycle hooks (`beforeTest`/`afterTest`; `onPrepare`/`onComplete`
  are available too for suite-level setup).
- **No built-in HTTP client.** Playwright ships `APIRequestContext`; WDIO doesn't. `ApiEngine` uses
  axios (over `got`) for its `validateStatus` hook, wide TypeScript adoption, and an API shape close
  enough to `fetch`/`APIRequestContext` that the request/response plumbing above it barely changed.
- **API specs still run through `wdio run`, not plain Mocha.** `@wdio/allure-reporter` is a WDIO
  reporter — it only captures step/attachment data from an active WDIO test run. So
  `config/wdio.api.conf.ts` opens a single headless Chrome session purely to satisfy the runner; API
  specs never touch `browser`/`$`, only `ApiFacade`. This keeps Allure reporting (and step-level
  attachments) consistent across web, mobile, and API instead of only covering two of the three.
- **Mobile coverage that a browser-only framework structurally can't have** — Playwright automates
  browsers, full stop; there's no route from a Playwright framework to a real mobile Chrome/Safari
  session (let alone a native app). This framework gets there through Appium, which is the whole
  reason it's WDIO-based rather than another Playwright project.

## Conventions when extending the framework

- Keep UI and API test logic strictly separate; don't import one layer's page objects/services into
  the other's specs.
- Web (`src/pages/web/`) and mobile (`src/pages/mobile/`) are different apps with their own page
  objects and locators — don't try to force them to share above the `BasePage`/`BaseComponent`/
  validators/reporting layer (see "Mobile is a native app" above for why that's the case now, and
  when it wasn't).
- New web UI flow: page object in `src/pages/web/`, component wrappers in `src/components/` if a new
  element type is needed, locators in `src/locators/web/`, constants in `src/constants/`, dataset +
  model under `src/data/`, validator in `src/validators/`, spec in `test/specs/web/*.spec.ts`.
- New native mobile UI flow: same shape as web, under `src/pages/mobile/`/`src/locators/mobile/`,
  spec in `test/specs/mobile/*.spec.ts` — but locators **must** come from a real device/simulator
  (`browser.getPageSource()`, or Appium Inspector), never guessed. See "Mobile is a native app"
  above for how the current login screen's locators were actually verified.
- New API flow: request/response models in `src/api/requests/`/`src/api/responses/`, endpoint
  constant in `src/constants/APIEndpoints.ts`, service method in `src/api/services/` (register it in
  `src/api/services/index.ts`), dataset + model under `src/data/`, spec in `test/specs/api/*.spec.ts`.
- Test file naming: `<feature>.spec.ts`; tag smoke-critical tests with `@smoke` in the test title
  (see `TestTags`/`npm run smoke`).
