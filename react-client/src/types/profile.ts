import type { DocumentStatus } from "@/types/status";

export interface CompanyProfile {
  legalName: string;
  displayName: string;
  initials: string;
  founded: string;
  employees: string;
  address: string;
  website: string;
  gstin: string;
  iec: string;
  panelStatus: DocumentStatus;
}

/** One label/value row rendered in the company details panel. */
export interface ProfileField {
  id: string;
  label: string;
  value: string;
}

/** Team member's document status re-uses DocumentStatus's tone semantics
 * (verified/uploaded/missing) even though the member isn't a document. */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: DocumentStatus;
}

export interface VerificationChecklistItem {
  id: string;
  label: string;
  status: DocumentStatus;
}

/** Buyer's saved shipping/contact profile — the buyer-portal counterpart
 * to CompanyProfile above. */
export interface BuyerProfile {
  fullName: string;
  companyName: string;
  initials: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  panelStatus: DocumentStatus;
}

/** One saved payment method on the buyer's profile. */
export interface PaymentMethod {
  id: string;
  label: string;
  detail: string;
  isDefault: boolean;
}
