import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderCompletePage } from '../pages/OrderCompletePage';
import { Users } from '../test-data/users';
import { annotateBrowserInfo } from '../utils/browser-info';
import { captureLiveFrames } from '../utils/live-preview';

interface PageFixtures {
  loginPage: LoginPage;
  productsPage: ProductsPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderCompletePage: OrderCompletePage;
}

interface SessionFixtures {
  /** Logs in as the standard user through the UI and lands on a verified Products page. */
  loggedInProductsPage: ProductsPage;
  /** Automatic: streams page snapshots to the QA dashboard when LIVE_PREVIEW=1. */
  livePreview: void;
  /** Automatic: records the browser version (and device OS version) as test annotations for reports. */
  browserInfo: void;
}

export const test = base.extend<PageFixtures & SessionFixtures>({
  livePreview: [
    async ({ page }, use, testInfo) => {
      await captureLiveFrames(page, testInfo, () => use());
    },
    { auto: true },
  ],
  browserInfo: [
    async ({ browser }, use, testInfo) => {
      annotateBrowserInfo(browser, testInfo);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  orderCompletePage: async ({ page }, use) => {
    await use(new OrderCompletePage(page));
  },

  loggedInProductsPage: async ({ loginPage, productsPage }, use) => {
    await base.step(`Log in as "${Users.standard.username}"`, async () => {
      await loginPage.goto();
      await loginPage.login(Users.standard);
      await productsPage.expectLoaded();
    });
    await use(productsPage);
  },
});

export { expect };
