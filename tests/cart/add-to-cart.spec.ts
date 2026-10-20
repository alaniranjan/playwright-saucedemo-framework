import { test } from '../../fixtures/test-fixtures';
import { Products } from '../../test-data/products';
import { labelTest } from '../../utils/test-helpers';

test.describe('Add to cart', { tag: '@regression' }, () => {
  test.beforeEach(async () => {
    await labelTest({ feature: 'Shopping cart', story: 'Add to cart' });
  });

  test('adds one product to the cart', { tag: '@smoke' }, async ({ loggedInProductsPage, cartPage }) => {
    const product = Products.backpack;

    await test.step(`Add "${product.name}"`, async () => {
      await loggedInProductsPage.addToCart(product.name);
      await loggedInProductsPage.expectCartCount(1);
    });

    await test.step('Open the cart and verify its contents', async () => {
      await loggedInProductsPage.openCart();
      await cartPage.expectLoaded();
      await cartPage.expectItems([product]);
    });
  });

  test('adds multiple products and shows their names and prices', async ({ loggedInProductsPage, cartPage }) => {
    const products = [Products.bikeLight, Products.boltTShirt, Products.fleeceJacket];

    await test.step('Add three products', async () => {
      await loggedInProductsPage.addToCart(...products.map((product) => product.name));
    });

    await test.step('Verify the cart badge count', async () => {
      await loggedInProductsPage.expectCartCount(products.length);
    });

    await test.step('Verify names, prices and quantities in the cart', async () => {
      await loggedInProductsPage.openCart();
      await cartPage.expectLoaded();
      await cartPage.expectItems(products);
    });
  });

  test('keeps cart contents when navigating away and back', async ({ loggedInProductsPage, cartPage }) => {
    const product = Products.redTShirt;

    await test.step(`Add "${product.name}" and open the cart`, async () => {
      await loggedInProductsPage.addToCart(product.name);
      await loggedInProductsPage.openCart();
      await cartPage.expectItems([product]);
    });

    await test.step('Return to products and reopen the cart', async () => {
      await cartPage.continueShopping();
      await loggedInProductsPage.expectLoaded();
      await loggedInProductsPage.openCart();
    });

    await test.step('Verify the product is still in the cart', async () => {
      await cartPage.expectItems([product]);
      await cartPage.expectCartCount(1);
    });
  });
});
