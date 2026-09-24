import type { InventoryStatus } from "@/types/status";

/** One SKU's stock level in a warehouse. */
export interface InventoryItem {
  id: string;
  sku: string;
  product: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  /** Stock level at/below which the SKU is flagged low. */
  threshold: number;
  unit: string;
  status: InventoryStatus;
}

/** Low-stock banner entry (dashboard alert), a reduced view of an InventoryItem. */
export interface LowStockAlert {
  id: string;
  product: string;
  unitsLeft: number;
  threshold: number;
}
