import { test } from '../../fixtures/test-fixtures';
import { CheckoutErrors, createCustomer, type CustomerInfo } from '../../test-data/customers';
import { Products } from '../../test-data/products';
import { labelTest } from '../../utils/test-helpers';

test.describe('Checkout information', { tag: '@regression' }, () => {
  test.beforeEach(async ({ loggedInProductsPage, cartPage, checkoutPage }) => {
    await labelTest({ feature: 'Checkout', story: 'Customer information' });

    await test.step('Add a product and navigate from the cart to checkout', async () => {
      await loggedInProductsPage.addToCart(Products.backpack.name);
      await loggedInProductsPage.openCart();
      await cartPage.expectLoaded();
      await cartPage.checkout();
      await checkoutPage.expectInformationStepLoaded();
    });
  });

  const missingFieldCases: ReadonlyArray<{ field: string; customer: CustomerInfo; error: string }> = [
    { field: 'first name', customer: createCustomer({ firstName: '' }), error: CheckoutErrors.firstNameRequired },
    { field: 'last name', customer: createCustomer({ lastName: '' }), error: CheckoutErrors.lastNameRequired },
    { field: 'postal code', customer: createCustomer({ postalCode: '' }), error: CheckoutErrors.postalCodeRequired },
  ];

  for (const { field, customer, error } of missingFieldCases) {
    test(`requires the ${field}`, async ({ checkoutPage }) => {
      await test.step(`Submit the form without a ${field}`, async () => {
        await checkoutPage.submitCustomerInformation(customer);
      });

      await test.step('Verify the validation error and that checkout does not advance', async () => {
        await checkoutPage.expectError(error);
        await checkoutPage.expectInformationStepLoaded();
      });
    });
  }

  test('requires all fields when the form is empty', async ({ checkoutPage }) => {
    await test.step('Submit an empty form', async () => {
      await checkoutPage.continueButton.click();
    });

    await test.step('Verify the first required field is reported', async () => {
      await checkoutPage.expectError(CheckoutErrors.firstNameRequired);
      await checkoutPage.expectInformationStepLoaded();
    });
  });

  test('continues to the overview with valid information', { tag: '@smoke' }, async ({ checkoutPage }) => {
    await test.step('Submit valid customer information', async () => {
      await checkoutPage.submitCustomerInformation(createCustomer());
    });

    await test.step('Verify the order overview is displayed', async () => {
      await checkoutPage.expectOverviewStepLoaded();
      await checkoutPage.expectOverviewItems([Products.backpack]);
    });
  });

  test('cancels checkout and returns to the cart', async ({ checkoutPage, cartPage }) => {
    await test.step('Cancel the checkout', async () => {
      await checkoutPage.cancelButton.click();
    });

    await test.step('Verify the cart is shown with its contents intact', async () => {
      await cartPage.expectLoaded();
      await cartPage.expectItems([Products.backpack]);
    });
  });
});
