'use client';

import Button from '@/components/ui/Button';
import NavIcon from '@/components/buyer/NavIcon';
import { actionLabels } from '@/data/seedData';
import useCart from '@/lib/useCart';

/**
 * Heart toggle that saves or unsaves a product.
 *
 * @param {object} props
 * @param {string} props.productId
 * @param {string} props.productName
 * @param {boolean} [props.withLabel]
 * @returns {import('react').ReactElement}
 */
export default function WishlistToggle({ productId, productName, withLabel = false }) {
  const { isWishlisted, toggleWishlist } = useCart();
  const saved = isWishlisted(productId);
  const label = saved ? `Remove ${productName} from wishlist` : `${actionLabels.addToWishlist}: ${productName}`;

  return (
    <Button
      variant={saved ? 'subtle' : 'ghost'}
      onClick={() => toggleWishlist(productId)}
      pressed={saved}
      title={label}
      className={saved ? 'text-coral' : undefined}
    >
      <NavIcon
        name="wishlist"
        size={14}
        filled={saved}
        title={withLabel ? undefined : label}
      />
      {withLabel && <span>{saved ? 'Saved' : actionLabels.addToWishlist}</span>}
    </Button>
  );
}
