'use client';

import Button from '@/components/ui/Button';
import { actionLabels } from '@/data/seedData';
import useCart from '@/lib/useCart';

/**
 * Adds a product to the cart at its minimum order quantity, which is the
 * smallest quantity the supplier will accept.
 *
 * @param {object} props
 * @param {import('@/data/products').Product} props.product
 * @param {'accent' | 'ghost'} [props.variant]
 * @param {string} [props.label]
 * @returns {import('react').ReactElement}
 */
export default function AddToCartButton({ product, variant = 'accent', label }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <Button
      variant={inCart ? 'subtle' : variant}
      onClick={() => addToCart(product.id, product.moq)}
      title={
        inCart
          ? `Add another ${product.moq} ${product.unit} of ${product.name}`
          : `${actionLabels.addToCart}: ${product.name}`
      }
    >
      {label ?? actionLabels.addToCart}
    </Button>
  );
}
