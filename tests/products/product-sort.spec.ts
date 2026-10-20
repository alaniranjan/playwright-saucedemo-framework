import { test, expect } from '../../fixtures/test-fixtures';
import { SortOption } from '../../pages/ProductsPage';
import { ALL_PRODUCTS, type Product } from '../../test-data/products';
import { formatPrice, labelTest, sortByName, sortByPrice } from '../../utils/test-helpers';

const sortCases: ReadonlyArray<{ label: string; option: SortOption; expected: Product[] }> = [
  { label: 'Name (A to Z)', option: SortOption.NameAsc, expected: sortByName(ALL_PRODUCTS, 'asc') },
  { label: 'Name (Z to A)', option: SortOption.NameDesc, expected: sortByName(ALL_PRODUCTS, 'desc') },
  { label: 'Price (low to high)', option: SortOption.PriceLowToHigh, expected: sortByPrice(ALL_PRODUCTS, 'asc') },
  { label: 'Price (high to low)', option: SortOption.PriceHighToLow, expected: sortByPrice(ALL_PRODUCTS, 'desc') },
];

test.describe('Product sorting', { tag: '@regression' }, () => {
  test.beforeEach(async () => {
    await labelTest({ feature: 'Products', story: 'Sorting' });
  });

  for (const { label, option, expected } of sortCases) {
    test(`sorts products by ${label}`, async ({ loggedInProductsPage }) => {
      await test.step(`Select "${label}"`, async () => {
        await loggedInProductsPage.sortBy(option);
        await expect(loggedInProductsPage.activeSortOption).toHaveText(label);
      });

      await test.step('Verify the product order', async () => {
        // Prices are always compared; names are compared only for name sorts because equal prices may tie in any order.
        await expect(loggedInProductsPage.productPrices).toHaveText(expected.map((product) => formatPrice(product.price)));
        if (option === SortOption.NameAsc || option === SortOption.NameDesc) {
          await expect(loggedInProductsPage.productNames).toHaveText(expected.map((product) => product.name));
        }
      });
    });
  }
});
