import { test } from '../../fixtures/test-fixtures';
import { LoginErrors } from '../../test-data/users';
import { labelTest } from '../../utils/test-helpers';

test.describe('Logout', { tag: '@regression' }, () => {
  test.beforeEach(async () => {
    await labelTest({ feature: 'Authentication', story: 'Logout' });
  });

  test('logs out and redirects to the login page', { tag: '@smoke' }, async ({ loggedInProductsPage, loginPage }) => {
    await test.step('Log out from the side menu', async () => {
      await loggedInProductsPage.logout();
    });

    await test.step('Verify the login page is displayed', async () => {
      await loginPage.expectLoaded();
    });
  });

  test('ends the session so protected pages require login again', async ({ loggedInProductsPage, loginPage }) => {
    await test.step('Log out from the side menu', async () => {
      await loggedInProductsPage.logout();
      await loginPage.expectLoaded();
    });

    await test.step('Try to reopen the inventory page', async () => {
      await loggedInProductsPage.goto();
    });

    await test.step('Verify access is denied', async () => {
      await loginPage.expectLoaded();
      await loginPage.expectError(LoginErrors.loginRequired('/inventory.html'));
    });
  });
});
