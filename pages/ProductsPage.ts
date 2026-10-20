import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../utils/test-helpers';

export const SortOption = {
  NameAsc: 'az',
  NameDesc: 'za',
  PriceLowToHigh: 'lohi',
  PriceHighToLow: 'hilo',
} as const;
export type SortOption = (typeof SortOption)[keyof typeof SortOption];

export class ProductsPage extends BasePage {
  readonly inventoryItems: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly sortDropdown: Locator;
  readonly activeSortOption: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryItems = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.productPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.activeSortOption = page.getByTestId('active-option');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.pageTitle).toHaveText('Products');
    await expect(this.inventoryItems.first()).toBeVisible();
  }

  productCard(name: string): Locator {
    return this.inventoryItems.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  addToCartButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.addToCartButton(name).click();
    }
  }

  async removeFromCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.removeButton(name).click();
    }
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async openProductDetails(name: string): Promise<void> {
    await this.productCard(name).getByTestId('inventory-item-name').click();
  }

  async getProductPrice(name: string): Promise<number> {
    return parsePrice(await this.productCard(name).getByTestId('inventory-item-price').innerText());
  }
}
