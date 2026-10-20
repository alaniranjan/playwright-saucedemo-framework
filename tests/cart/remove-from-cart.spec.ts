import { test, expect } from '../../fixtures/test-fixtures';
import { Products } from '../../test-data/products';
import { labelTest } from '../../utils/test-helpers';

test.describe('Remove from cart', { tag: '@regression' }, () => {
  test.beforeEach(async () => {
    await labelTest({ feature: 'Shopping cart', story: 'Remove from cart' });
  });

  test('removes one of several products from the cart', async ({ loggedInProductsPage, cartPage }) => {
    const kept = Products.backpack;
    const removed = Products.onesie;

    await test.step('Add two products and open the cart', async () => {
      await loggedInProductsPage.addToCart(kept.name, removed.name);
      await loggedInProductsPage.openCart();
      await cartPage.expectItems([kept, removed]);
    });

    await test.step(`Remove "${removed.name}"`, async () => {
      await cartPage.removeItem(removed.name);
    });

    await test.step('Verify only the remaining product is listed', async () => {
      await cartPage.expectItems([kept]);
      await cartPage.expectCartCount(1);
    });
  });

  test('empties the cart when the last product is removed', { tag: '@smoke' }, async ({ loggedInProductsPage, cartPage }) => {
    const product = Products.bikeLight;

    await test.step(`Add "${product.name}" and open the cart`, async () => {
      await loggedInProductsPage.addToCart(product.name);
      await loggedInProductsPage.openCart();
      await cartPage.expectItems([product]);
    });

    await test.step('Remove the product', async () => {
      await cartPage.removeItem(product.name);
    });

    await test.step('Verify the cart is empty', async () => {
      await expect(cartPage.cartItems).toHaveCount(0);
      await cartPage.expectCartCount(0);
    });
  });

  test('restores the "Add to cart" button after removing from the cart', async ({ loggedInProductsPage, cartPage }) => {
    const product = Products.fleeceJacket;

    await test.step('Add a product, then remove it in the cart', async () => {
      await loggedInProductsPage.addToCart(product.name);
      await loggedInProductsPage.openCart();
      await cartPage.removeItem(product.name);
    });

    await test.step('Continue shopping and verify navigation', async () => {
      await cartPage.continueShopping();
      await loggedInProductsPage.expectLoaded();
    });

    await test.step('Verify the product can be added again', async () => {
      await expect(loggedInProductsPage.addToCartButton(product.name)).toBeVisible();
      await loggedInProductsPage.expectCartCount(0);
    });
  });
});
