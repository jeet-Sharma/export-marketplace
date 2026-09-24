/** One point on the monthly revenue bar chart. */
export interface RevenueByMonth {
  label: string;
  value: number;
}

/** One ranked bar in the "top markets" panel. */
export interface TopMarket {
  id: string;
  label: string;
  value: number;
}

/** One row in the "top products" table. */
export interface TopProduct {
  id: string;
  product: string;
  orders: number;
  revenue: number;
}
