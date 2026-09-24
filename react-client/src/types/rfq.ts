import type { RfqStatus } from "@/types/status";

/** One incoming buyer request for quotation. */
export interface RfqRequest {
  id: string;
  product: string;
  buyer: string;
  country: string;
  quantity: string;
  /** Buyer's target price, display-ready string, e.g. "$8.20/kg". */
  target: string;
  incoterm: string;
  /** ISO date string (YYYY-MM-DD) the quote is due. */
  dueDate: string;
  status: RfqStatus;
}

/** Dashboard preview card — a reduced view of an RfqRequest. */
export interface PendingRfq {
  id: string;
  product: string;
  quantity: string;
  target: string;
  country: string;
  isNew: boolean;
}
