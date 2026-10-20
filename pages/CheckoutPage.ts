import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { formatPrice, type OrderTotals } from '../utils/test-helpers';
import type { CustomerInfo } from '../test-data/customers';
import type { Product } from '../test-data/products';

/** Covers both checkout steps: "Your Information" (step one) and "Overview" (step two). */
export class CheckoutPage extends BasePage {
  // Step one: customer information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  // Step two: order overview
  readonly overviewItems: Locator;
  readonly overviewItemNames: Locator;
  readonly overviewItemPrices: Locator;
  readonly paymentInfo: Locator;
  readonly shippingInfo: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = page.getByTestId('error');

    this.overviewItems = page.getByTestId('inventory-item');
    this.overviewItemNames = page.getByTestId('inventory-item-name');
    this.overviewItemPrices = page.getByTestId('inventory-item-price');
    this.paymentInfo = page.getByTestId('payment-info-value');
    this.shippingInfo = page.getByTestId('shipping-info-value');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async expectInformationStepLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Your Information');
  }

  async expectOverviewStepLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Overview');
  }

  async fillCustomerInformation({ firstName, lastName, postalCode }: CustomerInfo): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async submitCustomerInformation(customer: CustomerInfo): Promise<void> {
    await this.fillCustomerInformation(customer);
    await this.continueButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOverviewItems(products: readonly Product[]): Promise<void> {
    await expect(this.overviewItems).toHaveCount(products.length);
    await expect(this.overviewItemNames).toHaveText(products.map((product) => product.name));
    await expect(this.overviewItemPrices).toHaveText(products.map((product) => formatPrice(product.price)));
  }

  async expectTotals({ subtotal, tax, total }: OrderTotals): Promise<void> {
    await expect(this.subtotalLabel).toHaveText(`Item total: ${formatPrice(subtotal)}`);
    await expect(this.taxLabel).toHaveText(`Tax: ${formatPrice(tax)}`);
    await expect(this.totalLabel).toHaveText(`Total: ${formatPrice(total)}`);
  }
}
