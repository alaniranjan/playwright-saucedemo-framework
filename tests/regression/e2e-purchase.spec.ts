import { Severity } from 'allure-js-commons';
import { test, expect } from '../../fixtures/test-fixtures';
import { createCustomer } from '../../test-data/customers';
import { ALL_PRODUCTS, Products } from '../../test-data/products';
import { Users } from '../../test-data/users';
import { calculateOrderTotals, labelTest } from '../../utils/test-helpers';

test.describe('End-to-end purchase', { tag: ['@regression', '@e2e'] }, () => {
  test(
    'standard user buys two products and logs out',
    { tag: '@smoke' },
    async ({ loginPage, productsPage, cartPage, checkoutPage, orderCompletePage }) => {
      await labelTest({ feature: 'Business workflow', story: 'Purchase', severity: Severity.BLOCKER });

      const products = [Products.backpack, Products.bikeLight];
      const customer = createCustomer();
      const expectedTotals = calculateOrderTotals(products);

      await test.step('1. Open Sauce Demo', async () => {
        await loginPage.goto();
        await loginPage.expectLoaded();
      });

      await test.step('2. Log in', async () => {
        await loginPage.login(Users.standard);
      });

      await test.step('3. Verify the products page', async () => {
        await productsPage.expectLoaded();
        await expect(productsPage.inventoryItems).toHaveCount(ALL_PRODUCTS.length);
        await productsPage.expectCartCount(0);
      });

      await test.step('4. Add two products to the cart', async () => {
        await productsPage.addToCart(...products.map((product) => product.name));
        await productsPage.expectCartCount(products.length);
      });

      await test.step('5. Verify cart contents and quantity', async () => {
        await productsPage.openCart();
        await cartPage.expectLoaded();
        await cartPage.expectItems(products);
      });

      await test.step('6. Proceed to checkout', async () => {
        await cartPage.checkout();
        await checkoutPage.expectInformationStepLoaded();
      });

      await test.step('7. Enter customer information', async () => {
        await checkoutPage.submitCustomerInformation(customer);
      });

      await test.step('8. Verify the order summary and total', async () => {
        await checkoutPage.expectOverviewStepLoaded();
        await checkoutPage.expectOverviewItems(products);
        await checkoutPage.expectTotals(expectedTotals);
      });

      await test.step('9. Finish the order', async () => {
        await checkoutPage.finish();
      });

      await test.step('10. Verify the successful confirmation', async () => {
        await orderCompletePage.expectLoaded();
        await orderCompletePage.expectOrderConfirmed();
        await orderCompletePage.expectCartCount(0);
      });

      await test.step('11. Log out', async () => {
        await orderCompletePage.logout();
        await loginPage.expectLoaded();
      });
    },
  );
});
