"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  WalletCards,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

interface SuperadminNavProps {
  pendingStoresCount: number;
  pendingWithdrawalsCount: number;
  totalUsersCount: number;
}

export function SuperadminNav({
  pendingStoresCount,
  pendingWithdrawalsCount,
  totalUsersCount,
}: SuperadminNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/superadmin/dashboard",
      label: "Executive Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: "/superadmin/tenants",
      label: "Manajemen Tenant / Toko",
      icon: Store,
      badge: pendingStoresCount > 0 ? `${pendingStoresCount} PENDING` : null,
      badgeColor: "bg-[#9E2A2B] text-white",
    },
    {
      href: "/superadmin/users",
      label: "Manajemen Pengguna & Role",
      icon: Users,
      badge: `${totalUsersCount}`,
      badgeColor: "bg-neutral-200 text-[#0A0A0A]",
    },
    {
      href: "/superadmin/finance",
      label: "Global Order & Escrow",
      icon: WalletCards,
      badge:
        pendingWithdrawalsCount > 0
          ? `${pendingWithdrawalsCount} CAIRKAN`
          : null,
      badgeColor: "bg-[#185B37] text-white",
    },
    {
      href: "/superadmin/marketing",
      label: "Banner & Flash Sale",
      icon: Megaphone,
      badge: null,
    },
  ];

  return (
    <nav
      className="bg-white border border-neutral-200 p-2 flex flex-wrap items-center justify-between gap-2"
      data-testid="superadmin-nav"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`superadmin-nav-${item.href.split("/").pop()}`}
              className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors flex items-center gap-2 border ${
                isActive
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "text-neutral-600 border-transparent hover:border-neutral-300 hover:text-[#0A0A0A]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                    item.badgeColor || "bg-[#0A0A0A] text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAFA] border border-neutral-200 text-[10px] font-mono uppercase tracking-[0.14em] text-[#0A0A0A]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#185B37]" />
        <span>GUARD: ROLE === SUPERADMIN</span>
      </div>
    </nav>
  );
}
