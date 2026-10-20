import { Severity } from 'allure-js-commons';
import { test, expect } from '../../fixtures/test-fixtures';
import { createCustomer } from '../../test-data/customers';
import { Products } from '../../test-data/products';
import { calculateOrderTotals, labelTest } from '../../utils/test-helpers';

test.describe('Complete order', { tag: '@regression' }, () => {
  const products = [Products.boltTShirt, Products.fleeceJacket];

  test.beforeEach(async ({ loggedInProductsPage, cartPage, checkoutPage }) => {
    await labelTest({ feature: 'Checkout', story: 'Order completion', severity: Severity.CRITICAL });

    await test.step('Add products and reach the order overview', async () => {
      await loggedInProductsPage.addToCart(...products.map((product) => product.name));
      await loggedInProductsPage.openCart();
      await cartPage.checkout();
      await checkoutPage.submitCustomerInformation(createCustomer());
      await checkoutPage.expectOverviewStepLoaded();
    });
  });

  test('shows correct items, item total, tax and final price', async ({ checkoutPage }) => {
    await test.step('Verify the ordered items', async () => {
      await checkoutPage.expectOverviewItems(products);
    });

    await test.step('Verify payment and shipping information', async () => {
      await expect(checkoutPage.paymentInfo).toHaveText(/SauceCard #\d+/);
      await expect(checkoutPage.shippingInfo).toHaveText('Free Pony Express Delivery!');
    });

    await test.step('Verify item total, 8% tax and final price', async () => {
      await checkoutPage.expectTotals(calculateOrderTotals(products));
    });
  });

  test('completes the order and shows the confirmation', { tag: '@smoke' }, async ({ checkoutPage, orderCompletePage }) => {
    await test.step('Finish the order', async () => {
      await checkoutPage.finish();
    });

    await test.step('Verify the confirmation message', async () => {
      await orderCompletePage.expectLoaded();
      await orderCompletePage.expectOrderConfirmed();
    });

    await test.step('Verify the cart was emptied', async () => {
      await orderCompletePage.expectCartCount(0);
    });
  });

  test('returns to the products page after completing the order', async ({
    checkoutPage,
    orderCompletePage,
    productsPage,
  }) => {
    await test.step('Finish the order', async () => {
      await checkoutPage.finish();
      await orderCompletePage.expectLoaded();
    });

    await test.step('Go back home', async () => {
      await orderCompletePage.backHome();
    });

    await test.step('Verify the products page with an empty cart', async () => {
      await productsPage.expectLoaded();
      await productsPage.expectCartCount(0);
    });
  });
});
