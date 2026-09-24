import type { DocumentStatus } from "@/types/status";

/** One row in the vendor's document vault (compliance/trade paperwork). */
export interface VendorDocument {
  id: string;
  name: string;
  category: string;
  /** Internal/external reference number, or "\u2014" when not yet issued. */
  reference: string;
  /** ISO date string, or "\u2014" when never uploaded. */
  updated: string;
  /** ISO date string, or "\u2014" when the document doesn't expire. */
  expires: string;
  status: DocumentStatus;
}
