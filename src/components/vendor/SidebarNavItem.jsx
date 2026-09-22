"use client";

import { useState } from "react";
import Link from "next/link";
import { sidebarColors } from "@/theme/colors";
import NavIcon from "@/components/vendor/NavIcon";

// One sidebar row. Active rows get a saffron left marker, a lifted
// background and heavier text; hover is a softened version of the same.
export default function SidebarNavItem({ item, active = false }) {
  const [hovered, setHovered] = useState(false);
  const highlighted = active || hovered;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="flex items-center gap-3 font-body no-underline"
      style={{
        color: highlighted ? sidebarColors.itemActive : sidebarColors.item,
        backgroundColor: active
          ? sidebarColors.bgActive
          : hovered
            ? sidebarColors.bgHover
            : "transparent",
        borderLeft: `3px solid ${active ? sidebarColors.accent : "transparent"}`,
        padding: "9px 14px 9px 11px",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        lineHeight: 1.2,
      }}
    >
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
