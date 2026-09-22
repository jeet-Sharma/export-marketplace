'use client';

import Select from '@/components/ui/Select';
import { currencies } from '@/data/cart';
import useCart from '@/lib/useCart';

/**
 * Display-currency picker. Amounts are stored in USD and converted on render,
 * so switching currency never mutates the cart.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {boolean} [props.labelHidden]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function CurrencySelect({ id, labelHidden = false, className }) {
  const { currencyCode, setCurrencyCode } = useCart();

  return (
    <Select
      id={id}
      label="Currency"
      labelHidden={labelHidden}
      value={currencyCode}
      onChange={setCurrencyCode}
      options={currencies.map((currency) => ({
        value: currency.code,
        label: `${currency.code} · ${currency.label}`,
      }))}
      className={className}
    />
  );
}
