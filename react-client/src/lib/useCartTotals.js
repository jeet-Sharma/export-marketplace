'use client';

import { useMemo } from 'react';
import cartTotals from './cartTotals';
import useCart from './useCart';

/**
 * Cart breakdown for the current store state, shared by the cart and checkout
 * screens so both always agree on the figures.
 *
 * @param {import('@/lib/filterProducts').CatalogProduct[]} products
 * @returns {import('./cartTotals').CartTotals}
 */
export default function useCartTotals(products) {
  const { lines, destinationCountry, shippingMethodId } = useCart();

  return useMemo(
    () => cartTotals({ lines, products, destinationCountry, shippingMethodId }),
    [lines, products, destinationCountry, shippingMethodId],
  );
}
