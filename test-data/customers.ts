import { randomUUID } from 'node:crypto';

export interface CustomerInfo {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

/** Builds unique customer data so parallel runs never share inputs. */
export function createCustomer(overrides: Partial<CustomerInfo> = {}): CustomerInfo {
  const suffix = randomUUID().slice(0, 8);
  return {
    firstName: `QA-${suffix}`,
    lastName: `Tester-${suffix}`,
    postalCode: String(10000 + Math.floor(Math.random() * 90000)),
    ...overrides,
  };
}

export const CheckoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;

export const OrderConfirmation = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;
