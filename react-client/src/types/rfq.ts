import type { RfqStatus } from "@/types/status";

/**
 * Fields shared by both sides of an RFQ. `RfqRequest` (vendor, incoming)
 * and `BuyerRfqRequest` (buyer, outgoing) diverge on exactly one concern:
 * a vendor needs to know *who* is asking (`buyer`) and *by when*
 * (`dueDate`); a buyer already knows both of those about their own
 * request and instead needs to know *how many suppliers have responded*
 * (`quotesReceived`) and *when they sent it* (`submitted`).
 */
interface RfqRequestBase {
  id: string;
  product: string;
  country: string;
  quantity: string;
  /** Target price, display-ready string, e.g. "$8.20/kg". */
  target: string;
  status: RfqStatus;
}

/** One incoming buyer request for quotation. */
export interface RfqRequest extends RfqRequestBase {
  buyer: string;
  incoterm: string;
  /** ISO date string (YYYY-MM-DD) the quote is due. */
  dueDate: string;
}

/**
 * One RFQ the buyer has sent out — the mirror image of RfqRequest. Same
 * base shape, but tracks how many suppliers have quoted back instead of
 * who the requesting buyer was (the buyer already knows that's them).
 */
export interface BuyerRfqRequest extends RfqRequestBase {
  /** ISO date string (YYYY-MM-DD) the buyer submitted the RFQ. */
  submitted: string;
  quotesReceived: number;
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

/** One supplier's quote against a BuyerRfqRequest, for the compare-quotes view. */
export interface SupplierQuote {
  id: string;
  rfqId: string;
  supplierName: string;
  supplierVerified: boolean;
  /** Display-ready price string, e.g. "$8.00/kg". */
  price: string;
  /** Display-ready delivery estimate, e.g. "7 days". */
  delivery: string;
}
