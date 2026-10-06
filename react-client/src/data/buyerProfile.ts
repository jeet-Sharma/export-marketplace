// Buyer profile, address/contact details and saved payment methods —
// the buyer-side counterpart to data/profile.ts (vendor's company profile
// and verification checklist).
import type { ProfileField, BuyerProfile, PaymentMethod } from "@/types/profile";

export const buyerProfile: BuyerProfile = {
  fullName: "Priya Sharma",
  companyName: "Sharma Global Imports",
  initials: "PS",
  email: "priya@sharmaglobalimports.example",
  phone: "+1 415 555 0182",
  country: "United States",
  address: "482 Market Street, Suite 300, San Francisco, CA 94105, USA",
  panelStatus: "verified",
};

export const buyerProfileFields: ProfileField[] = [
  { id: "fullName", label: "Full Name", value: buyerProfile.fullName },
  { id: "companyName", label: "Company Name", value: buyerProfile.companyName },
  { id: "email", label: "Email", value: buyerProfile.email },
  { id: "phone", label: "Phone", value: buyerProfile.phone },
  { id: "country", label: "Country", value: buyerProfile.country },
  { id: "address", label: "Shipping Address", value: buyerProfile.address },
];

export const buyerPaymentMethods: PaymentMethod[] = [
  { id: "pm-1", label: "Visa", detail: "Ending in 4242", isDefault: true },
  { id: "pm-2", label: "PayPal", detail: "priya@sharmaglobalimports.example", isDefault: false },
];

export interface BuyerProfileMeta {
  profilePanelTitle: string;
  paymentPanelTitle: string;
  complianceTitle: string;
}

export const buyerProfileMeta: BuyerProfileMeta = {
  profilePanelTitle: "Contact & Shipping Details",
  paymentPanelTitle: "Payment Methods",
  complianceTitle: "Buyer Compliance",
};
