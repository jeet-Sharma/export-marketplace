'use client';

import Button from '@/components/ui/Button';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import NavIcon from '@/components/buyer/NavIcon';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import { cartCopy } from '@/data/cart';
import { actionLabels } from '@/data/seedData';
import { formatQuantity } from '@/lib/formatCurrency';
import formatMoney, { formatUnitMoney } from '@/lib/formatMoney';
import useCart from '@/lib/useCart';
import QuantityStepper from './QuantityStepper';

/** @type {import('@/components/ui/Table').TableColumn[]} */
export const cartColumns = [
  { key: 'product', label: 'Product' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'quantity', label: 'Quantity', align: 'right' },
  { key: 'subtotal', label: 'Subtotal', align: 'right' },
  { key: 'action', label: 'Remove', align: 'right', labelHidden: true },
];

/**
 * Stepper increment: a tenth of the MOQ, so large-volume goods move in
 * meaningful blocks instead of single units.
 * @param {number} moq
 * @returns {number}
 */
function stepForMoq(moq) {
  return Math.max(1, Math.round(moq / 10));
}

/**
 * @param {object} props
 * @param {import('@/lib/cartTotals').CartItem} props.item
 * @param {import('@/data/suppliers').Supplier | null} props.supplier
 * @param {string} props.currencyCode
 * @param {boolean} [props.last]
 * @returns {import('react').ReactElement}
 */
export default function CartItemRow({ item, supplier, currencyCode, last = false }) {
  const { setQuantity, removeFromCart } = useCart();
  const { product } = item;

  return (
    <TableRow last={last}>
      <TableCell>
        <ProductIdentity
          name={product.name}
          supplier={supplier}
          note={`MOQ ${formatQuantity(product.moq, product.unit)}`}
          size="sm"
        />

        {item.belowMoq && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-coral">
            <NavIcon name="alert" size={12} />
            {cartCopy.moqWarning} · add{' '}
            {formatQuantity(item.moqShortfall, product.unit)}
          </p>
        )}
      </TableCell>

      <TableCell align="right" numeric>
        {formatUnitMoney(product.unitPriceUsd, product.unit, currencyCode)}
      </TableCell>

      <TableCell align="right">
        <QuantityStepper
          id={`cart-quantity-${product.id}`}
          label={`Quantity of ${product.name} in ${product.unit}`}
          value={item.quantity}
          step={stepForMoq(product.moq)}
          onChange={(quantity) => setQuantity(product.id, quantity)}
        />
      </TableCell>

      <TableCell align="right" numeric>
        {formatMoney(item.subtotalUsd, currencyCode)}
      </TableCell>

      <TableCell align="right">
        <Button
          variant="subtle"
          onClick={() => removeFromCart(product.id)}
          title={`${actionLabels.remove} ${product.name} from cart`}
        >
          <NavIcon
            name="close"
            size={14}
            title={`${actionLabels.remove} ${product.name} from cart`}
          />
        </Button>
      </TableCell>
    </TableRow>
  );
}
