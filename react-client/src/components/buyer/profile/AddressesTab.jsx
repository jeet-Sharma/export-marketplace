'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import { addresses as seedAddresses } from '@/data/profile';

/**
 * Address list with set-default and remove actions. Local state only.
 * @returns {import('react').ReactElement}
 */
export default function AddressesTab() {
  const [addresses, setAddresses] = useState(seedAddresses);

  const setDefault = (id) =>
    setAddresses((current) =>
      current.map((address) => ({ ...address, isDefault: address.id === id })),
    );

  const remove = (id) =>
    setAddresses((current) => current.filter((address) => address.id !== id));

  return (
    <Panel title="Saved Addresses" padded={false}>
      <ul className="divide-y divide-line">
        {addresses.map((address) => (
          <li key={address.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">
                {address.label} {address.isDefault && <span className="text-saffron">· Default</span>}
              </p>
              <p className="mt-0.5 text-xs text-textdim">
                {address.contactName} · {address.lines.join(', ')}, {address.country}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {!address.isDefault && (
                <Button variant="ghost" onClick={() => setDefault(address.id)}>
                  Set Default
                </Button>
              )}
              <Button variant="subtle" onClick={() => remove(address.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
