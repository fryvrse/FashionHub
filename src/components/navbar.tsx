"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  PackageCheck,
  Store,
  ShieldCheck,
} from "lucide-react";
import { DemoAccount } from "@/lib/auth-shared";
import { RoleSwitcher } from "./role-switcher";
import { useCart } from "@/context/cart-context";

export function Navbar({ currentSession }: { currentSession: DemoAccount }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const { totalItemsCount, groupedByStore } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSession.role === "STORE_ADMIN") {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200">
      {/* Top Editorial Utility Bar */}
      <div className="bg-[#0A0A0A] text-neutral-300 text-[10px] uppercase tracking-[0.18em] py-1.5 px-4 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 truncate">
            <span className="text-white font-semibold">
              FASHIONHUB ARCHIVE &amp; ATELIER
            </span>
            <span className="hidden md:inline text-neutral-600">/</span>
            <span className="hidden md:inline text-neutral-400">
              Bandung • Jakarta • Surabaya Direct Dispatch
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-neutral-400">
              Sesi:{" "}
              <strong className="text-white font-mono">
                {currentSession.badgeText}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Editorial Wordmark */}
        <Link
          href={
            currentSession.role === "STORE_ADMIN"
              ? "/seller/dashboard"
              : currentSession.role === "SUPERADMIN" &&
                (pathname.startsWith("/superadmin") || pathname.startsWith("/admin"))
              ? "/superadmin/dashboard"
              : "/"
          }
          className="flex items-baseline gap-2.5 flex-shrink-0 group"
        >
          <span className="font-serif text-2xl md:text-[26px] font-bold tracking-tight text-[#0A0A0A] leading-none">
            FASHIONHUB
          </span>
          <span className="hidden lg:inline-block text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400 border-l border-neutral-200 pl-2.5">
            Multi-Tenant Edit
          </span>
        </Link>

        {/* Architectural Search Input (Marketplace View) */}
        {currentSession.role !== "STORE_ADMIN" ? (
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md relative hidden sm:block"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siluet, batik tulis, linen, selvedge denim..."
              className="w-full pl-9 pr-16 py-1.5 text-xs bg-[#FAFAFA] focus:bg-white border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none transition-colors placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
            >
              Cari
            </button>
          </form>
        ) : (
          <div className="flex-1 max-w-lg hidden md:flex items-center gap-2 bg-[#FAFAFA] border border-neutral-300 text-[#0A0A0A] px-3 py-1.5 text-[11px]">
            <Store className="w-3.5 h-3.5 text-[#185B37] flex-shrink-0" />
            <span className="truncate">
              Tenant Terisolasi: <strong>{currentSession.storeName}</strong>{" "}
              <code className="font-mono text-[10px] text-neutral-500">
                (/seller/*)
              </code>
            </span>
          </div>
        )}

        {/* Right Actions & Role Switcher */}
        <div className="flex items-center gap-2">
          {currentSession.role !== "STORE_ADMIN" && (
            <>
              <Link
                href="/cart"
                id="navbar-cart-link"
                className="px-2.5 py-1.5 border border-transparent hover:border-neutral-300 text-[#0A0A0A] transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Keranjang Multi-Tenant"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] uppercase tracking-[0.12em] font-semibold">
                  Tas
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#0A0A0A] text-white leading-none">
                  {totalItemsCount}
                </span>
                {groupedByStore.length > 0 && (
                  <span className="hidden lg:inline text-[10px] font-mono text-neutral-500">
                    ({groupedByStore.length} Toko)
                  </span>
                )}
              </Link>

              <Link
                href="/orders"
                className="px-2.5 py-1.5 border border-transparent hover:border-neutral-300 text-[#0A0A0A] transition-colors flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold"
                title="Transaksi & Pecahan SubOrder"
              >
                <PackageCheck className="w-4 h-4 text-[#185B37]" />
                <span className="hidden xl:inline">Pesanan</span>
              </Link>
            </>
          )}

          {currentSession.role === "SUPERADMIN" && (
            <Link
              href="/superadmin/dashboard"
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold flex items-center gap-1.5 border transition-colors ${
                pathname.startsWith("/superadmin") ||
                pathname.startsWith("/admin")
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "bg-white hover:bg-neutral-100 text-[#0A0A0A] border-neutral-300"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#185B37]" />
              <span className="hidden md:inline">Superadmin Panel</span>
            </Link>
          )}

          <div className="h-4 w-px bg-neutral-200 mx-0.5" />

          {/* Mandatory Top-Right Demo Role Switcher */}
          <RoleSwitcher currentSession={currentSession} />
        </div>
      </div>
    </header>
  );
}
