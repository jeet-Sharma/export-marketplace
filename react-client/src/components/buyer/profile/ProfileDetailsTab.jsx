'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Panel from '@/components/ui/Panel';
import Select from '@/components/ui/Select';
import { buyerCountries } from '@/data/profile';
import { currencies } from '@/data/cart';

/**
 * Editable company details form. Local state only, no persistence.
 * @param {object} props
 * @param {import('@/data/profile').buyerProfile} props.profile
 * @returns {import('react').ReactElement}
 */
export default function ProfileDetailsTab({ profile }) {
  const [form, setForm] = useState({
    contactName: profile.contactName,
    email: profile.email,
    companyName: profile.companyName,
    country: profile.country,
    preferredCurrency: profile.preferredCurrency,
  });

  const update = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Panel title="Company Profile">
      <form onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input id="profile-contact" label="Contact Name" value={form.contactName} onChange={update('contactName')} />
        <Input id="profile-email" label="Email" type="email" value={form.email} onChange={update('email')} />
        <Input id="profile-company" label="Company" value={form.companyName} onChange={update('companyName')} />
        <Select
          id="profile-country"
          label="Country"
          value={form.country}
          onChange={update('country')}
          options={buyerCountries.map((country) => ({ value: country, label: country }))}
        />
        <Select
          id="profile-currency"
          label="Preferred Currency"
          value={form.preferredCurrency}
          onChange={update('preferredCurrency')}
          options={currencies.map((currency) => ({ value: currency.code, label: currency.code }))}
        />

        <div className="sm:col-span-2">
          <Button type="submit" variant="accent" size="md">
            Save Changes
          </Button>
        </div>
      </form>
    </Panel>
  );
}
