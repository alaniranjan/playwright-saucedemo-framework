import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailsPage extends BasePage {
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.getByTestId('inventory-item-name');
    this.productDescription = page.getByTestId('inventory-item-desc');
    this.productPrice = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backToProductsButton = page.getByRole('button', { name: 'Back to products' });
  }

  async goto(productId: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${productId}`);
  }

  async expectLoaded(productId: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/inventory-item\\.html\\?id=${productId}$`));
    await expect(this.backToProductsButton).toBeVisible();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
