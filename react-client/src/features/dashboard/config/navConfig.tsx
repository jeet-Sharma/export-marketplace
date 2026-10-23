import type { ComponentType } from "react";
import type { IconProps } from "../components/icons";
import {
  BadgeCheckIcon,
  CircleHelpIcon,
  ClipboardListIcon,
  CreditCardIcon,
  GlobeIcon,
  HeartIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  PackageIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
  UsersIcon,
} from "../components/icons";

export type DashboardRole = "admin" | "vendor" | "user";

export type NavItem = {
  key: string;
  label: string;
  icon: ComponentType<IconProps>;
  href: string;
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

export type DashboardProfile = {
  name: string;
  role: string;
  initials: string;
};

export type RoleConfig = {
  /** Short label shown under the brand (e.g. "Market Bloom admin") */
  workspaceLabel: string;
  /** Breadcrumb root shown in the utility bar */
  workspaceContext: string;
  primaryNav: NavSection;
  secondaryNav: NavSection;
  profile: DashboardProfile;
};

const SUPPORT_SECTION: NavSection = {
  heading: "Support",
  items: [
    {
      key: "settings",
      label: "Settings",
      icon: SettingsIcon,
      href: "#settings",
    },
    {
      key: "help",
      label: "Help & support",
      icon: CircleHelpIcon,
      href: "#help",
    },
  ],
};

/**
 * Sidebar entities differ per role. This is the single source of truth —
 * change a role's nav items here and the whole dashboard shell updates.
 */
export const ROLE_CONFIG: Record<DashboardRole, RoleConfig> = {
  admin: {
    workspaceLabel: "Market Bloom admin",
    workspaceContext: "Marketplace operations",
    primaryNav: {
      heading: "Operations",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          href: "/dashboard",
        },
        { key: "vendors", label: "Vendors", icon: UsersIcon, href: "#vendors" },
        {
          key: "products",
          label: "Products",
          icon: PackageIcon,
          href: "/dashboard/products",
        },
        {
          key: "orders",
          label: "Orders",
          icon: ShoppingBagIcon,
          href: "#orders",
        },
        {
          key: "logistics",
          label: "Logistics",
          icon: TruckIcon,
          href: "#logistics",
        },
        {
          key: "payments",
          label: "Payments",
          icon: CreditCardIcon,
          href: "#payments",
        },
        {
          key: "compliance",
          label: "Compliance",
          icon: ShieldCheckIcon,
          href: "#compliance",
        },
        { key: "users", label: "Users", icon: UsersIcon, href: "#users" },
        {
          key: "marketing",
          label: "Marketing",
          icon: MegaphoneIcon,
          href: "#marketing",
        },
      ],
    },
    secondaryNav: SUPPORT_SECTION,
    profile: {
      name: "Amina Malik",
      role: "Marketplace admin",
      initials: "AM",
    },
  },

  vendor: {
    workspaceLabel: "Market Bloom vendor",
    workspaceContext: "Vendor workspace",
    primaryNav: {
      heading: "My business",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          href: "/dashboard",
        },
        {
          key: "products",
          label: "My products",
          icon: PackageIcon,
          href: "/dashboard/products",
        },
        {
          key: "orders",
          label: "Orders",
          icon: ShoppingBagIcon,
          href: "#orders",
        },
        {
          key: "quotes",
          label: "Quote requests",
          icon: ClipboardListIcon,
          href: "#quotes",
        },
        {
          key: "shipments",
          label: "Shipments",
          icon: TruckIcon,
          href: "#shipments",
        },
        {
          key: "earnings",
          label: "Earnings",
          icon: CreditCardIcon,
          href: "#earnings",
        },
        {
          key: "verification",
          label: "Verification",
          icon: BadgeCheckIcon,
          href: "#verification",
        },
      ],
    },
    secondaryNav: SUPPORT_SECTION,
    profile: {
      name: "Malar Harvest",
      role: "Verified vendor",
      initials: "MH",
    },
  },

  user: {
    workspaceLabel: "Market Bloom buyer",
    workspaceContext: "Buyer account",
    primaryNav: {
      heading: "Shopping",
      items: [
        {
          key: "home",
          label: "Browse market",
          icon: GlobeIcon,
          href: "/dashboard",
        },
        {
          key: "orders",
          label: "My orders",
          icon: ShoppingBagIcon,
          href: "#orders",
        },
        {
          key: "quotes",
          label: "My quotes",
          icon: ClipboardListIcon,
          href: "#quotes",
        },
        { key: "saved", label: "Saved items", icon: HeartIcon, href: "#saved" },
        {
          key: "shipments",
          label: "Shipments",
          icon: TruckIcon,
          href: "#shipments",
        },
        {
          key: "payments",
          label: "Payment methods",
          icon: CreditCardIcon,
          href: "#payments",
        },
      ],
    },
    secondaryNav: SUPPORT_SECTION,
    profile: {
      name: "Diego Castillo",
      role: "Buyer",
      initials: "DC",
    },
  },
};
