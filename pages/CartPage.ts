import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { formatPrice } from '../utils/test-helpers';
import type { Product } from '../test-data/products';

export class CartPage extends BasePage {
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  cartItem(name: string): Locator {
    return this.cartItems.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async removeItem(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.cartItem(name).getByRole('button', { name: 'Remove' }).click();
    }
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  /** Asserts the cart holds exactly these products, in order, with quantity 1 each. */
  async expectItems(products: readonly Product[]): Promise<void> {
    await expect(this.cartItems).toHaveCount(products.length);
    await expect(this.itemNames).toHaveText(products.map((product) => product.name));
    await expect(this.itemPrices).toHaveText(products.map((product) => formatPrice(product.price)));
    await expect(this.itemQuantities).toHaveText(products.map(() => '1'));
  }
}
