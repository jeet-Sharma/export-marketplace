'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Panel from '@/components/ui/Panel';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { newRfqFormCopy } from '@/data/rfq';
import { formatQuantity } from '@/lib/formatCurrency';

/** @type {{ productId: string, quantity: string, targetPrice: string, destinationCountry: string, notes: string }} */
const emptyForm = {
  productId: '',
  quantity: '',
  targetPrice: '',
  destinationCountry: '',
  notes: '',
};

/**
 * Validates the draft and reports one message per invalid field.
 * @param {typeof emptyForm} form
 * @param {import('@/data/products').Product | undefined} product
 * @returns {Record<string, string>}
 */
function validate(form, product) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (!form.productId) errors.productId = 'Choose a product.';

  const quantity = Number(form.quantity);
  if (!quantity || quantity <= 0) {
    errors.quantity = 'Enter the quantity you need.';
  } else if (product && quantity < product.moq) {
    // Suppliers will not quote below their minimum order quantity.
    errors.quantity = `Minimum order is ${formatQuantity(product.moq, product.unit)}.`;
  }

  const targetPrice = Number(form.targetPrice);
  if (!targetPrice || targetPrice <= 0) errors.targetPrice = 'Enter a target unit price.';

  if (!form.destinationCountry) errors.destinationCountry = 'Choose a delivery country.';

  return errors;
}

/**
 * New RFQ form. Submits to the caller, which owns the RFQ list.
 *
 * @param {object} props
 * @param {import('@/data/products').Product[]} props.products
 * @param {string[]} props.destinations
 * @param {(input: import('@/lib/useRfqList').NewRfqInput) => void} props.onSubmit
 * @param {() => void} props.onCancel
 * @returns {import('react').ReactElement}
 */
export default function NewRfqForm({ products, destinations, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const selectedProduct = products.find((product) => product.id === form.productId);

  /** @param {keyof typeof emptyForm} field */
  const update = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

  const handleProductChange = (productId) => {
    const product = products.find((candidate) => candidate.id === productId);

    // Pre-fill the quantity with the MOQ, which is the smallest valid request.
    setForm((current) => ({
      ...current,
      productId,
      quantity: current.quantity || (product ? String(product.moq) : ''),
    }));
  };

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validate(form, selectedProduct);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedProduct) return;

    onSubmit({
      product: selectedProduct,
      quantity: Number(form.quantity),
      targetPriceUsd: Number(form.targetPrice),
      destinationCountry: form.destinationCountry,
      notes: form.notes.trim(),
    });

    setForm(emptyForm);
  };

  return (
    <Panel title={newRfqFormCopy.title} description={newRfqFormCopy.description}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            id="rfq-product"
            label="Product"
            value={form.productId}
            onChange={handleProductChange}
            options={[
              { value: '', label: 'Select a product' },
              ...products.map((product) => ({
                value: product.id,
                label: `${product.name} · ${product.category}`,
              })),
            ]}
            error={errors.productId}
          />

          <Input
            id="rfq-quantity"
            label={`Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ''}`}
            type="number"
            min={1}
            value={form.quantity}
            onChange={update('quantity')}
            placeholder="0"
            error={errors.quantity}
            hint={
              selectedProduct
                ? `MOQ ${formatQuantity(selectedProduct.moq, selectedProduct.unit)}`
                : undefined
            }
          />

          <Input
            id="rfq-target-price"
            label="Target Price (USD per unit)"
            type="number"
            min={0}
            step="0.01"
            value={form.targetPrice}
            onChange={update('targetPrice')}
            placeholder="0.00"
            prefix="$"
            error={errors.targetPrice}
          />

          <Select
            id="rfq-destination"
            label="Delivery Country"
            value={form.destinationCountry}
            onChange={update('destinationCountry')}
            options={[
              { value: '', label: 'Select a country' },
              ...destinations.map((country) => ({ value: country, label: country })),
            ]}
            error={errors.destinationCountry}
          />
        </div>

        <Textarea
          id="rfq-notes"
          label="Notes"
          value={form.notes}
          onChange={update('notes')}
          placeholder={newRfqFormCopy.notesPlaceholder}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" variant="accent" size="md">
            {newRfqFormCopy.submitLabel}
          </Button>
          <Button variant="subtle" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
