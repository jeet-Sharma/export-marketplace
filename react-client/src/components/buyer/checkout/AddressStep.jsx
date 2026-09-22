'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Panel from '@/components/ui/Panel';
import Select from '@/components/ui/Select';
import { checkoutCopy } from '@/data/cart';
import { buyerCountries } from '@/data/profile';
import OptionCard from './OptionCard';

const emptyAddress = { label: '', contactName: '', street: '', city: '', country: '' };

/**
 * Shipping address selection with an inline "add address" form.
 *
 * @param {object} props
 * @param {import('@/data/profile').Address[]} props.addresses
 * @param {string} props.selectedAddressId
 * @param {(addressId: string) => void} props.onSelect
 * @param {(address: import('@/data/profile').Address) => void} props.onAdd
 * @returns {import('react').ReactElement}
 */
export default function AddressStep({ addresses, selectedAddressId, onSelect, onAdd }) {
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyAddress);

  const complete = Boolean(draft.label && draft.contactName && draft.street && draft.city && draft.country);

  /** @param {keyof typeof emptyAddress} field */
  const update = (field) => (value) => setDraft((current) => ({ ...current, [field]: value }));

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!complete) return;

    onAdd({
      id: `addr-${Date.now()}`,
      label: draft.label,
      contactName: draft.contactName,
      lines: [draft.street, draft.city],
      country: draft.country,
      phone: '',
      isDefault: false,
    });

    setDraft(emptyAddress);
    setFormOpen(false);
  };

  return (
    <Panel
      title="Shipping Address"
      description="Where the consignment is delivered after customs clearance."
      action={
        <Button variant="ghost" onClick={() => setFormOpen((open) => !open)} pressed={formOpen}>
          {checkoutCopy.addAddressLabel}
        </Button>
      }
    >
      <div className="space-y-2">
        {addresses.map((address) => (
          <OptionCard
            key={address.id}
            name="checkout-address"
            value={address.id}
            checked={address.id === selectedAddressId}
            onSelect={onSelect}
            title={address.label}
            description={
              <>
                {address.contactName} · {address.lines.join(', ')}, {address.country}
                {address.phone && ` · ${address.phone}`}
              </>
            }
            meta={address.isDefault ? 'Default' : undefined}
          />
        ))}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="address-label"
              label="Label"
              value={draft.label}
              onChange={update('label')}
              placeholder="Warehouse, office..."
            />
            <Input
              id="address-contact"
              label="Contact Name"
              value={draft.contactName}
              onChange={update('contactName')}
            />
            <Input
              id="address-street"
              label="Street"
              value={draft.street}
              onChange={update('street')}
            />
            <Input
              id="address-city"
              label="City and Postcode"
              value={draft.city}
              onChange={update('city')}
            />
            <Select
              id="address-country"
              label="Country"
              value={draft.country}
              onChange={update('country')}
              options={[
                { value: '', label: 'Select a country' },
                ...buyerCountries.map((country) => ({ value: country, label: country })),
              ]}
            />
          </div>

          <Button type="submit" variant="accent" size="md" disabled={!complete}>
            Save address
          </Button>
        </form>
      )}
    </Panel>
  );
}
