import { MobileUser, User } from "../../models/index.js";

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
  // local-only credentials with no shared backend session/token — safe to reuse across
  // concurrent Android/iOS sessions, unlike the real EventHub accounts `web`/`api` use above.
  mobile: {
    validUser: MobileUser;
    invalidPassword: MobileUser;
  };
}
