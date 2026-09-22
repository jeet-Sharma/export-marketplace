'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import { paymentMethods as seedPaymentMethods } from '@/data/profile';

/**
 * Payment method list with set-default and remove actions. Local state only.
 * @returns {import('react').ReactElement}
 */
export default function PaymentMethodsTab() {
  const [methods, setMethods] = useState(seedPaymentMethods);

  const setDefault = (id) =>
    setMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === id })));

  const remove = (id) => setMethods((current) => current.filter((method) => method.id !== id));

  return (
    <Panel title="Payment Methods" padded={false}>
      <ul className="divide-y divide-line">
        {methods.map((method) => (
          <li key={method.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">
                {method.label} {method.isDefault && <span className="text-saffron">· Default</span>}
              </p>
              <p className="mt-0.5 text-xs text-textdim">{method.detail}</p>
            </div>

            <div className="flex items-center gap-1.5">
              {!method.isDefault && (
                <Button variant="ghost" onClick={() => setDefault(method.id)}>
                  Set Default
                </Button>
              )}
              <Button variant="subtle" onClick={() => remove(method.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
