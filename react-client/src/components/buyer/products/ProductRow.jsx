import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import { formatQuantity } from '@/lib/formatCurrency';
import { formatUnitMoney } from '@/lib/formatMoney';
import AddToCartButton from './AddToCartButton';
import WishlistToggle from './WishlistToggle';

/** @type {import('@/components/ui/Table').TableColumn[]} */
export const productColumns = [
  { key: 'product', label: 'Product' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'moq', label: 'MOQ', align: 'right' },
  { key: 'shipsTo', label: 'Ships to' },
  { key: 'action', label: 'Action', align: 'right' },
];

/** How many destinations to name before collapsing the rest into a count. */
const VISIBLE_DESTINATIONS = 2;

/**
 * @param {object} props
 * @param {import('@/lib/filterProducts').CatalogProduct} props.product
 * @param {string} props.currencyCode
 * @param {boolean} [props.last]
 * @returns {import('react').ReactElement}
 */
export default function ProductRow({ product, currencyCode, last = false }) {
  const namedDestinations = product.shipsTo.slice(0, VISIBLE_DESTINATIONS);
  const hiddenDestinations = product.shipsTo.length - namedDestinations.length;

  return (
    <TableRow last={last}>
      <TableCell>
        <ProductIdentity
          name={product.name}
          supplier={product.supplier}
          showSupplierName={false}
          note={`${product.category} · HS ${product.hsCode}`}
        />
      </TableCell>

      <TableCell>
        <span className="block text-sm">{product.supplier?.name ?? '—'}</span>
        <span className="block text-[11px] text-textdim">{product.supplier?.location}</span>
      </TableCell>

      <TableCell align="right" numeric>
        {formatUnitMoney(product.unitPriceUsd, product.unit, currencyCode)}
      </TableCell>

      <TableCell align="right" numeric>
        {formatQuantity(product.moq, product.unit)}
      </TableCell>

      <TableCell>
        <span className="block text-sm">{namedDestinations.join(', ')}</span>
        {hiddenDestinations > 0 && (
          <span className="block text-[11px] text-textdim">
            +{hiddenDestinations} more
          </span>
        )}
      </TableCell>

      <TableCell align="right">
        <div className="flex items-center justify-end gap-1.5">
          <AddToCartButton product={product} />
          <WishlistToggle productId={product.id} productName={product.name} />
        </div>
      </TableCell>
    </TableRow>
  );
}
