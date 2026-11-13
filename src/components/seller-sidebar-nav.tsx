"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Lock,
  MapPin,
} from "lucide-react";
import { SeedStore, SeedUser } from "../../prisma/seed-data";

export function SellerSidebarNav({
  store,
  newOrdersCount,
  productsCount,
}: {
  store: SeedStore & { owner: SeedUser };
  newOrdersCount: number;
  productsCount: number;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/seller/dashboard",
      label: "Ringkasan Toko",
      icon: LayoutDashboard,
      testId: "seller-nav-dashboard",
    },
    {
      href: "/seller/products",
      label: "Manajemen Produk",
      icon: Package,
      badge: String(productsCount),
      testId: "seller-nav-products",
    },
    {
      href: "/seller/orders",
      label: "Pesanan Masuk (SubOrder)",
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? `${newOrdersCount} NEW` : undefined,
      badgeHighlight: newOrdersCount > 0,
      testId: "seller-nav-orders",
    },
    {
      href: "/seller/settings",
      label: "Pengaturan Profil Toko",
      icon: Settings,
      testId: "seller-nav-settings",
    },
  ];

  return (
    <div
      id="seller-tenant-header"
      className="bg-[#0A0A0A] text-white border border-[#0A0A0A]"
    >
      {/* Top Tenant Identity Header */}
      <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-neutral-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#185B37] text-white font-semibold">
              <Lock className="w-3 h-3" />
              TENANT ISOLATION: WHERE storeId = &quot;{store.id}&quot;
            </span>
            <span className="px-2 py-0.5 border border-neutral-700 text-neutral-300">
              {store.isOfficialStore ? "OFFICIAL STORE" : "STAR SELLER"}
            </span>
          </div>

          <h1
            data-testid="active-tenant-store-name"
            className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-white"
          >
            {store.name}
          </h1>

          <p className="text-xs text-neutral-400 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#185B37]" />
              Origin: <strong className="text-white">{store.city}</strong>
            </span>
            <span className="text-neutral-700">/</span>
            <span className="font-mono text-[11px]">/{store.slug}</span>
            <span className="text-neutral-700">/</span>
            <span>
              Principal: <strong className="text-white">{store.owner?.name}</strong>
            </span>
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 text-xs space-y-1 self-start lg:self-end">
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
            KONTEKS SESI RBAC AKTIF
          </div>
          <div className="font-mono text-white text-[11px] font-semibold">
            role: &quot;STORE_ADMIN&quot; | storeId: &quot;{store.id}&quot;
          </div>
          <div className="text-[11px] text-neutral-400">
            Data produk &amp; pesanan tenant lain terisolasi penuh.
          </div>
        </div>
      </div>

      {/* Horizontal Architectural Navigation Bar */}
      <div className="bg-neutral-950 px-5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-2 whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-white text-[#0A0A0A] border-white"
                  : "text-neutral-400 border-transparent hover:text-white hover:border-neutral-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    item.badgeHighlight
                      ? "bg-[#9E2A2B] text-white"
                      : isActive
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
