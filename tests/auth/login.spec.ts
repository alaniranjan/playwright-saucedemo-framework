import { Severity, severity } from 'allure-js-commons';
import { test, expect } from '../../fixtures/test-fixtures';
import { LoginErrors, Users, type UserCredentials } from '../../test-data/users';
import { labelTest } from '../../utils/test-helpers';

test.describe('Login', { tag: '@regression' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await labelTest({ feature: 'Authentication', story: 'Login' });
    await loginPage.goto();
  });

  test('logs in successfully with a valid user', { tag: '@smoke' }, async ({ loginPage, productsPage }) => {
    await severity(Severity.BLOCKER);

    await test.step('Submit valid credentials', async () => {
      await loginPage.login(Users.standard);
    });

    await test.step('Verify the Products page is displayed', async () => {
      await productsPage.expectLoaded();
      await productsPage.expectCartCount(0);
    });
  });

  const rejectedLogins: ReadonlyArray<{ title: string; user: UserCredentials; error: string; tags?: string[] }> = [
    { title: 'rejects an invalid username', user: Users.invalidUsername, error: LoginErrors.invalidCredentials },
    { title: 'rejects an invalid password', user: Users.invalidPassword, error: LoginErrors.invalidCredentials },
    { title: 'requires a username when both fields are empty', user: Users.empty, error: LoginErrors.usernameRequired },
    { title: 'requires a username', user: Users.emptyUsername, error: LoginErrors.usernameRequired },
    { title: 'requires a password', user: Users.emptyPassword, error: LoginErrors.passwordRequired },
    { title: 'blocks a locked-out user', user: Users.lockedOut, error: LoginErrors.lockedOut, tags: ['@smoke'] },
  ];

  for (const { title, user, error, tags = [] } of rejectedLogins) {
    test(title, { tag: tags }, async ({ loginPage, page }) => {
      await test.step('Submit credentials', async () => {
        await loginPage.login(user);
      });

      await test.step('Verify the error message and that the user stays on the login page', async () => {
        await loginPage.expectError(error);
        await expect(page).toHaveURL('/');
      });
    });
  }

  test('dismisses the error message', async ({ loginPage }) => {
    await test.step('Trigger a validation error', async () => {
      await loginPage.login(Users.empty);
      await loginPage.expectError(LoginErrors.usernameRequired);
    });

    await test.step('Close the error and verify it disappears', async () => {
      await loginPage.errorCloseButton.click();
      await expect(loginPage.errorMessage).toBeHidden();
    });
  });

  test('prevents access to the inventory without logging in', async ({ productsPage, loginPage }) => {
    await test.step('Open the inventory page directly', async () => {
      await productsPage.goto();
    });

    await test.step('Verify the user is redirected to login with an explanation', async () => {
      await loginPage.expectLoaded();
      await loginPage.expectError(LoginErrors.loginRequired('/inventory.html'));
    });
  });
});
