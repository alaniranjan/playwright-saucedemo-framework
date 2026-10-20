import { test, expect } from '../../fixtures/test-fixtures';
import { ALL_PRODUCTS, Products } from '../../test-data/products';
import { formatPrice, labelTest } from '../../utils/test-helpers';

test.describe('Product list', { tag: '@regression' }, () => {
  test.beforeEach(async () => {
    await labelTest({ feature: 'Products', story: 'Inventory' });
  });

  test('displays the products page after login', { tag: '@smoke' }, async ({ loggedInProductsPage }) => {
    await test.step('Verify the page header, sort control and product count', async () => {
      await expect(loggedInProductsPage.pageTitle).toHaveText('Products');
      await expect(loggedInProductsPage.sortDropdown).toBeVisible();
      await expect(loggedInProductsPage.inventoryItems).toHaveCount(ALL_PRODUCTS.length);
    });
  });

  test('shows the expected product names and prices', async ({ loggedInProductsPage }) => {
    await test.step('Verify product names', async () => {
      await expect(loggedInProductsPage.productNames).toHaveText(ALL_PRODUCTS.map((product) => product.name));
    });

    await test.step('Verify product prices', async () => {
      await expect(loggedInProductsPage.productPrices).toHaveText(
        ALL_PRODUCTS.map((product) => formatPrice(product.price)),
      );
    });
  });

  test('opens product details and returns to the list', async ({ loggedInProductsPage, productDetailsPage }) => {
    const product = Products.fleeceJacket;

    await test.step(`Open details for "${product.name}"`, async () => {
      await loggedInProductsPage.openProductDetails(product.name);
    });

    await test.step('Verify the product details', async () => {
      await productDetailsPage.expectLoaded(product.id);
      await expect(productDetailsPage.productName).toHaveText(product.name);
      await expect(productDetailsPage.productPrice).toHaveText(formatPrice(product.price));
      await expect(productDetailsPage.productDescription).not.toBeEmpty();
    });

    await test.step('Return to the products list', async () => {
      await productDetailsPage.backToProducts();
      await loggedInProductsPage.expectLoaded();
    });
  });

  test('adds a product to the cart from the details page', async ({ loggedInProductsPage, productDetailsPage }) => {
    const product = Products.onesie;

    await test.step(`Open details for "${product.name}" and add it to the cart`, async () => {
      await loggedInProductsPage.openProductDetails(product.name);
      await productDetailsPage.expectLoaded(product.id);
      await productDetailsPage.addToCartButton.click();
    });

    await test.step('Verify the button toggles and the badge updates', async () => {
      await expect(productDetailsPage.removeButton).toBeVisible();
      await productDetailsPage.expectCartCount(1);
    });
  });

  test('adds and removes products from the inventory page', async ({ loggedInProductsPage }) => {
    const first = Products.backpack;
    const second = Products.bikeLight;

    await test.step('Add two products', async () => {
      await loggedInProductsPage.addToCart(first.name, second.name);
      await expect(loggedInProductsPage.removeButton(first.name)).toBeVisible();
      await expect(loggedInProductsPage.removeButton(second.name)).toBeVisible();
      await loggedInProductsPage.expectCartCount(2);
    });

    await test.step('Remove one product', async () => {
      await loggedInProductsPage.removeFromCart(first.name);
      await expect(loggedInProductsPage.addToCartButton(first.name)).toBeVisible();
      await loggedInProductsPage.expectCartCount(1);
    });

    await test.step('Remove the remaining product', async () => {
      await loggedInProductsPage.removeFromCart(second.name);
      await expect(loggedInProductsPage.addToCartButton(second.name)).toBeVisible();
      await loggedInProductsPage.expectCartCount(0);
    });
  });
});
