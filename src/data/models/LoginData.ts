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

  // Native app (Swag Labs demo app — see src/pages/mobile/LoginPage.ts). Its seed accounts
  // (standard_user/locked_out_user/problem_user, all with password secret_sauce) are fixed,
  // local-only, *publicly documented* demo credentials with no shared backend session/token —
  // not secrets, so plain literals here are fine, unlike `web`/`api` above.
  mobile: {
    validUser: MobileUser;
    invalidPassword: MobileUser;
  };
}
