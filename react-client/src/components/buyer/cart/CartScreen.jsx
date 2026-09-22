'use client';

import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import Table from '@/components/ui/Table';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import PageHeader from '@/components/buyer/PageHeader';
import SplitSection from '@/components/buyer/SplitSection';
import { cartCopy } from '@/data/cart';
import { pageHeaders } from '@/data/seedData';
import { wishlistCopy } from '@/data/wishlist';
import api from '@/lib/api';
import useCart from '@/lib/useCart';
import useCartTotals from '@/lib/useCartTotals';
import useResource from '@/lib/useResource';
import CartItemRow, { cartColumns } from './CartItemRow';
import CartSummary from './CartSummary';
import ShippingCalculator from './ShippingCalculator';

/**
 * Cart: editable lines, freight estimate and order totals.
 * @returns {import('react').ReactElement}
 */
export default function CartScreen() {
  const { data, loading, error, reload } = useResource(api.getProducts);
  const { currencyCode } = useCart();
  const totals = useCartTotals(data ?? []);

  return (
    <>
      <PageHeader
        title={pageHeaders.cart.title}
        breadcrumb={pageHeaders.cart.breadcrumb}
        actions={
          <Button href="/products" variant="ghost" size="md">
            {wishlistCopy.browseLabel}
          </Button>
        }
      />

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={totals.itemCount === 0}
        skeletonRows={5}
        empty={
          <Panel>
            <EmptyState
              icon="cart"
              title={cartCopy.emptyTitle}
              description={cartCopy.emptyDescription}
              action={
                <Button href="/products" variant="accent" size="md">
                  {wishlistCopy.browseLabel}
                </Button>
              }
            />
          </Panel>
        }
      >
        <SplitSection
          main={
            <Panel
              title="Cart Items"
              description={`${totals.itemCount} ${totals.itemCount === 1 ? 'line' : 'lines'}`}
              padded={false}
            >
              <Table columns={cartColumns} caption="Products in your cart">
                {totals.items.map((item, index) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    supplier={item.product.supplier ?? null}
                    currencyCode={currencyCode}
                    last={index === totals.items.length - 1}
                  />
                ))}
              </Table>
            </Panel>
          }
          side={
            <>
              <ShippingCalculator totals={totals} currencyCode={currencyCode} />
              <CartSummary totals={totals} currencyCode={currencyCode} />
            </>
          }
        />
      </DataState>
    </>
  );
}
