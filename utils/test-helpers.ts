import * as allure from 'allure-js-commons';
import { TAX_RATE, type Product } from '../test-data/products';

export interface OrderTotals {
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
}

/** "$29.99" or "Item total: $29.99" -> 29.99 */
export function parsePrice(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!match?.[1]) {
    throw new Error(`Unable to parse a price from "${text}"`);
  }
  return Number(match[1]);
}

/** 29.99 -> "$29.99" */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Calculates totals in integer cents to avoid floating point drift. */
export function calculateOrderTotals(products: readonly Product[], taxRate: number = TAX_RATE): OrderTotals {
  const subtotalCents = products.reduce((sum, product) => sum + Math.round(product.price * 100), 0);
  const taxCents = Math.round(subtotalCents * taxRate);
  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  };
}

export function sortByName(products: readonly Product[], direction: 'asc' | 'desc'): Product[] {
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
  return direction === 'asc' ? sorted : sorted.reverse();
}

export function sortByPrice(products: readonly Product[], direction: 'asc' | 'desc'): Product[] {
  const sorted = [...products].sort((a, b) => a.price - b.price);
  return direction === 'asc' ? sorted : sorted.reverse();
}

interface AllureLabels {
  readonly feature: string;
  readonly story?: string;
  readonly severity?: allure.Severity;
}

/** Groups tests in the Allure "Behaviors" view: epic > feature > story. */
export async function labelTest({ feature, story, severity }: AllureLabels): Promise<void> {
  await allure.epic('Sauce Demo');
  await allure.feature(feature);
  if (story) {
    await allure.story(story);
  }
  if (severity) {
    await allure.severity(severity);
  }
}
