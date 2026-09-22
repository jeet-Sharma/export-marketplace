'use client';

import Button from '@/components/ui/Button';
import DetailList from '@/components/buyer/DetailList';
import LetterTile from '@/components/buyer/LetterTile';
import NavIcon from '@/components/buyer/NavIcon';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import { actionLabels } from '@/data/seedData';
import { formatQuantity } from '@/lib/formatCurrency';
import formatDate from '@/lib/formatDate';
import { formatUnitMoney } from '@/lib/formatMoney';
import useCart from '@/lib/useCart';

/**
 * @param {object} props
 * @param {import('@/lib/filterProducts').CatalogProduct} props.product
 * @param {string} props.savedOn
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function WishlistCard({ product, savedOn, currencyCode }) {
  const { moveToCart, removeFromWishlist } = useCart();

  return (
    <article className="flex flex-col rounded-sharp border border-line bg-panel">
      <div className="flex h-24 items-center justify-center border-b border-line bg-paper">
        <LetterTile label={product.name} size="lg" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <ProductIdentity
          name={product.name}
          supplier={product.supplier}
          note={product.category}
          showTile={false}
        />

        <DetailList
          variant="grid"
          items={[
            {
              label: 'Price',
              value: formatUnitMoney(product.unitPriceUsd, product.unit, currencyCode),
              numeric: true,
            },
            {
              label: 'MOQ',
              value: formatQuantity(product.moq, product.unit),
              numeric: true,
            },
            { label: 'Saved', value: formatDate(savedOn) },
            { label: 'Lead Time', value: `${product.leadTimeDays} days`, numeric: true },
          ]}
        />

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <Button
            variant="accent"
            onClick={() => moveToCart(product.id, product.moq)}
            className="flex-1"
          >
            {actionLabels.moveToCart}
          </Button>
          <Button
            variant="ghost"
            onClick={() => removeFromWishlist(product.id)}
            title={`${actionLabels.remove} ${product.name} from wishlist`}
          >
            <NavIcon
              name="close"
              size={14}
              title={`${actionLabels.remove} ${product.name} from wishlist`}
            />
          </Button>
        </div>
      </div>
    </article>
  );
}
