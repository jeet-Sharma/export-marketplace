"use client";

import { useState } from "react";

// Country selector that surfaces estimated delivery time and approximate
// duties/taxes for the selected destination, per the product detail spec.
export default function CountryLogistics({ countryLogistics = {} }) {
  const countries = Object.keys(countryLogistics);
  const [selected, setSelected] = useState(countries[0] ?? "");
  const info = countryLogistics[selected];

  if (countries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-body text-text-dim text-[12px]">Select Country</span>
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="font-body bg-panel border border-line rounded px-[10px] py-[7px] text-text text-[13px] focus:outline-none focus:border-saffron"
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </label>

      {info && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-soft rounded px-3 py-2">
            <p className="font-body text-text-dim text-[11px]">Delivery</p>
            <p className="font-heading font-semibold text-teal text-[13px]">
              {info.delivery}
            </p>
          </div>
          <div className="bg-blue-grey-soft rounded px-3 py-2">
            <p className="font-body text-text-dim text-[11px]">Duties &amp; Taxes</p>
            <p className="font-heading font-semibold text-blue-grey text-[13px]">
              {info.duties}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
