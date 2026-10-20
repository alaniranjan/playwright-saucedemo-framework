import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrderConfirmation } from '../test-data/customers';

export class OrderCompletePage extends BasePage {
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly confirmationImage: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationHeader = page.getByRole('heading', { name: OrderConfirmation.header });
    this.confirmationText = page.getByTestId('complete-text');
    this.confirmationImage = page.getByTestId('pony-express');
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Complete!');
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.confirmationHeader).toBeVisible();
    await expect(this.confirmationText).toHaveText(OrderConfirmation.text);
    await expect(this.confirmationImage).toBeVisible();
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
