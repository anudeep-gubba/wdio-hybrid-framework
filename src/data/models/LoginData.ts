import { MobileUser, User } from "../../models/index.js";

/**
 * Every field here is a plain value — `TestData.load<LoginData>("loginData")` returns real,
 * usable credentials directly, no wrapper call needed. Where a value is sensitive, the dataset
 * file writes it as `${someSecretKey}` (e.g. `email: ${webValidUserEmail}`) instead of a literal —
 * looks and behaves exactly like any other value. `BaseDataProvider.load()` resolves any such
 * placeholder against `config/secrets/<env>.secrets.json` before this type is ever seen. See
 * src/data/utils/secretInterpolation.ts and config/secrets/README.md.
 */
export interface LoginData {
  web: {
    validUser: User;
    invalidPassword: User;
    invalidEmail: User;
  };

  api: {
    validUser: User;
  };

  // Native app — eventhub's own mobile client (see src/pages/mobile/LoginPage.ts), the same
  // product `web`/`api` already cover, so `validUser`/`incorrectPassword` are real, secret-backed
  // EventHub credentials (${mobileValidUserEmail}/${mobileValidUserPassword}) like `web`/`api`
  // above — not the old Swag Labs demo app's fixed, publicly-documented seed accounts.
  //
  // This build's login always succeeds regardless of password (mock auth, not a real backend
  // check) — see LoginPage's class doc — so there is no server-rejected "wrong password" case
  // here. `incorrectPassword` is a deliberate *positive* case (still logs in); the two negative
  // cases are both client-side Flutter form validation: `blankCredentials` (required-field
  // errors) and `malformedEmail` (invalid-email error).
  mobile: {
    validUser: MobileUser;
    incorrectPassword: MobileUser;
    blankCredentials: MobileUser;
    malformedEmail: MobileUser;
  };
}
