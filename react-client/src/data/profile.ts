// Vendor company profile, contacts and verification checklist.
import type { CompanyProfile, ProfileField, TeamMember, VerificationChecklistItem } from "@/types/profile";

export const companyProfile: CompanyProfile = {
  legalName: "ABC Exports Private Limited",
  displayName: "ABC Exports",
  initials: "AE",
  founded: "2014",
  employees: "120-150",
  address: "Plot 44, Industrial Estate, Erode, Tamil Nadu 638003, India",
  website: "abcexports.example",
  gstin: "33ABCDE1234F1Z5",
  iec: "0414512345",
  panelStatus: "verified",
};

export const profileFields: ProfileField[] = [
  { id: "legalName", label: "Legal Name", value: companyProfile.legalName },
  { id: "founded", label: "Founded", value: companyProfile.founded },
  { id: "employees", label: "Employees", value: companyProfile.employees },
  { id: "website", label: "Website", value: companyProfile.website },
  { id: "gstin", label: "GSTIN", value: companyProfile.gstin },
  { id: "iec", label: "Import Export Code", value: companyProfile.iec },
  { id: "address", label: "Registered Address", value: companyProfile.address },
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Rajat Shah",
    role: "Owner / Maker",
    email: "rajat@abcexports.example",
    status: "verified",
  },
  {
    id: "tm-2",
    name: "Priya Nair",
    role: "Checker",
    email: "priya@abcexports.example",
    status: "verified",
  },
  {
    id: "tm-3",
    name: "Imran Qureshi",
    role: "Logistics",
    email: "imran@abcexports.example",
    status: "uploaded",
  },
];

export const verificationChecklist: VerificationChecklistItem[] = [
  { id: "v-1", label: "Business registration", status: "verified" },
  { id: "v-2", label: "Tax identity (GSTIN)", status: "verified" },
  { id: "v-3", label: "Import Export Code", status: "verified" },
  { id: "v-4", label: "Bank account proof", status: "uploaded" },
  { id: "v-5", label: "Factory audit report", status: "missing" },
];

export interface ProfileMeta {
  companyPanelTitle: string;
  teamPanelTitle: string;
  verificationPanelTitle: string;
}

export const profileMeta: ProfileMeta = {
  companyPanelTitle: "Company Details",
  teamPanelTitle: "Team Members",
  verificationPanelTitle: "Verification Checklist",
};
