'use client';

import { useMemo } from 'react';
import { analyticsDeltas, statLabels } from '@/data/seedData';
import formatMoney from '@/lib/formatMoney';
import orderStats from '@/lib/orderStats';
import rfqStats from '@/lib/rfqStats';

/**
 * Derives the four dashboard headline figures from the loaded collections.
 *
 * @param {{
 *   orders: import('@/lib/filterOrders').OrderRecord[],
 *   rfqs: import('@/lib/filterRfqs').RfqRecord[],
 *   suppliers: import('@/data/suppliers').Supplier[],
 * } | null} data
 * @param {string} currencyCode
 * @returns {import('@/components/buyer/StatGrid').Stat[]}
 */
export default function useDashboardStats(data, currencyCode) {
  return useMemo(() => {
    if (!data) return [];

    const orders = orderStats(data.orders);
    const rfqs = rfqStats(data.rfqs);
    const verifiedSuppliers = data.suppliers.filter((supplier) => supplier.verified).length;

    return [
      {
        id: 'total-orders',
        label: statLabels.totalOrders,
        value: String(orders.total),
        deltaLabel: `${orders.placedInLatestMonth} this month`,
        deltaDirection: 'up',
      },
      {
        id: 'total-spend',
        label: statLabels.totalSpend,
        value: formatMoney(orders.totalSpendUsd, currencyCode),
        deltaLabel: `${analyticsDeltas.spendGrowthPct}%`,
        deltaDirection: 'up',
      },
      {
        id: 'open-rfqs',
        label: statLabels.openRfqs,
        value: String(rfqs.open),
        deltaLabel: `${rfqs.newQuotes} new quote${rfqs.newQuotes === 1 ? '' : 's'}`,
      },
      {
        id: 'saved-suppliers',
        label: statLabels.savedSuppliers,
        value: String(data.suppliers.length),
        deltaLabel: `${verifiedSuppliers} verified`,
      },
    ];
  }, [data, currencyCode]);
}
