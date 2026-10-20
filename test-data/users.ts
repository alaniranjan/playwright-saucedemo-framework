export interface UserCredentials {
  readonly username: string;
  readonly password: string;
}

// Sauce Demo publishes these accounts on its login page; env vars allow overrides without code changes.
const password = process.env.SAUCE_PASSWORD ?? 'secret_sauce';
const standardUsername = process.env.SAUCE_STANDARD_USER ?? 'standard_user';

export const Users = {
  standard: { username: standardUsername, password },
  lockedOut: { username: process.env.SAUCE_LOCKED_OUT_USER ?? 'locked_out_user', password },
  invalidUsername: { username: 'unknown_user', password },
  invalidPassword: { username: standardUsername, password: 'invalid_password' },
  emptyUsername: { username: '', password },
  emptyPassword: { username: standardUsername, password: '' },
  empty: { username: '', password: '' },
} as const satisfies Record<string, UserCredentials>;

export const LoginErrors = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  loginRequired: (path: string) => `Epic sadface: You can only access '${path}' when you are logged in.`,
} as const;
