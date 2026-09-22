'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import PageHeader from '@/components/buyer/PageHeader';
import SplitSection from '@/components/buyer/SplitSection';
import { checkoutSteps, checkoutCopy } from '@/data/cart';
import { addresses as seedAddresses, paymentMethods } from '@/data/profile';
import { actionLabels, pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import { findShippingMethod } from '@/lib/cartTotals';
import useCart from '@/lib/useCart';
import useCartTotals from '@/lib/useCartTotals';
import useResource from '@/lib/useResource';
import AddressStep from './AddressStep';
import CartSummary from '@/components/buyer/cart/CartSummary';
import ReviewStep from './ReviewStep';
import ShippingPaymentStep from './ShippingPaymentStep';
import StepIndicator from './StepIndicator';

/**
 * 3-step checkout: address, shipping & payment, review.
 * @returns {import('react').ReactElement}
 */
export default function CheckoutScreen() {
  const { data: products, loading, error, reload } = useResource(api.getProducts);
  const { currencyCode, shippingMethodId, clearCart } = useCart();
  const totals = useCartTotals(products ?? []);

  const [stepIndex, setStepIndex] = useState(0);
  const [addresses, setAddresses] = useState(seedAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    seedAddresses.find((address) => address.isDefault)?.id ?? seedAddresses[0]?.id,
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    paymentMethods.find((method) => method.isDefault)?.id ?? paymentMethods[0]?.id,
  );
  const [placed, setPlaced] = useState(false);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === selectedPaymentMethodId,
  );
  const shippingMethod = findShippingMethod(shippingMethodId);

  const isLastStep = stepIndex === checkoutSteps.length - 1;

  /** @param {import('@/data/profile').Address} address */
  const handleAddAddress = (address) => {
    setAddresses((current) => [...current, address]);
    setSelectedAddressId(address.id);
  };

  const handlePrimaryAction = () => {
    if (isLastStep) {
      setPlaced(true);
      clearCart();
      return;
    }
    setStepIndex((index) => index + 1);
  };

  if (placed) {
    return (
      <>
        <PageHeader title={pageHeaders.checkout.title} breadcrumb={pageHeaders.checkout.breadcrumb} />
        <Panel>
          <EmptyState
            icon="check"
            title={checkoutCopy.placedTitle}
            description={checkoutCopy.placedDescription}
            action={
              <Button href="/orders" variant="accent" size="md">
                Go to Orders
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title={pageHeaders.checkout.title} breadcrumb={pageHeaders.checkout.breadcrumb} />

      <StepIndicator steps={checkoutSteps} activeIndex={stepIndex} />

      <DataState loading={loading} error={error} onRetry={reload} skeletonRows={5}>
        <SplitSection
          main={
            <>
              {stepIndex === 0 && (
                <AddressStep
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAdd={handleAddAddress}
                />
              )}

              {stepIndex === 1 && (
                <ShippingPaymentStep
                  products={products ?? []}
                  paymentMethods={paymentMethods}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onSelectPaymentMethod={setSelectedPaymentMethodId}
                  currencyCode={currencyCode}
                />
              )}

              {stepIndex === 2 && (
                <ReviewStep
                  address={selectedAddress}
                  shippingMethod={shippingMethod}
                  paymentMethod={selectedPaymentMethod}
                  totals={totals}
                  currencyCode={currencyCode}
                />
              )}

              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <Button variant="subtle" size="md" onClick={() => setStepIndex((index) => index - 1)}>
                    Back
                  </Button>
                )}
                <Button variant="accent" size="md" onClick={handlePrimaryAction}>
                  {isLastStep ? actionLabels.placeOrder : 'Continue'}
                </Button>
              </div>
            </>
          }
          side={<CartSummary totals={totals} currencyCode={currencyCode} showCheckout={false} />}
        />
      </DataState>
    </>
  );
}
