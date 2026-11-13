import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";

export default function SuperadminDashboardPage() {
  const metrics = db.getSuperadminExecutiveMetrics();
  const stores = db.getAllStores();
  const orders = db.getOrders();
  const withdrawals = db.getWithdrawals();

  const maxStoreBalance = Math.max(...stores.map((s) => s.balance), 1000000);

  return (
    <div className="space-y-6" data-testid="superadmin-dashboard-view">
      {/* 4 Primary Global Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total GMV Platform */}
        <div
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
          data-testid="metric-global-gmv"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            01 / Total GMV Platform
          </span>
          <div
            className="font-mono text-2xl font-bold text-[#0A0A0A] mt-3"
            data-testid="value-global-gmv"
          >
            {formatIDR(metrics.totalGMV)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>{metrics.totalOrdersCount} MASTER ORDER</span>
            <span className="text-[#185B37] font-bold">
              {metrics.totalSubOrdersCount} SUBORDER
            </span>
          </div>
        </div>

        {/* 2. Total Komisi Platform (5%) */}
        <div
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
          data-testid="metric-global-commission"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            02 / Komisi Platform ({metrics.commissionRatePercent}%)
          </span>
          <div
            className="font-mono text-2xl font-bold text-[#185B37] mt-3"
            data-testid="value-global-commission"
          >
            {formatIDR(metrics.totalCommission)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>PLATFORM TAKE RATE</span>
            <span className="text-[#0A0A0A] font-bold">
              {metrics.commissionRatePercent}% NET
            </span>
          </div>
        </div>

        {/* 3. Total Toko Aktif vs PENDING */}
        <div
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
          data-testid="metric-global-stores"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            03 / Toko Aktif vs Pending
          </span>
          <div className="flex items-baseline gap-2 mt-3 font-mono">
            <span
              className="text-2xl font-bold text-[#0A0A0A]"
              data-testid="value-active-stores"
            >
              {metrics.activeStoresCount} Aktif
            </span>
            <span className="text-xs font-bold text-[#9E2A2B]">
              / {metrics.pendingStoresCount} Pending
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="font-mono">
              SUSPENDED: <strong>{metrics.suspendedStoresCount}</strong>
            </span>
            <Link
              href="/superadmin/tenants"
              className="text-[#0A0A0A] font-semibold uppercase tracking-wider text-[10px] hover:underline flex items-center gap-0.5"
            >
              Moderasi <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 4. Total Pengguna Terdaftar */}
        <div
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
          data-testid="metric-global-users"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            04 / Total Pengguna Terdaftar
          </span>
          <div
            className="font-mono text-2xl font-bold text-[#0A0A0A] mt-3"
            data-testid="value-total-users"
          >
            {metrics.totalUsersCount} Akun
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="font-mono text-[10px]">
              {metrics.superadminCount} ADM • {metrics.storeAdminCount} TEN •{" "}
              {metrics.buyerCount} BUY
            </span>
            <Link
              href="/superadmin/users"
              className="text-[#0A0A0A] font-semibold uppercase tracking-wider text-[10px] hover:underline flex items-center gap-0.5"
            >
              Kelola <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row: Tenant Performance Breakdown & Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Performa Tenant & Kontribusi Saldo Escrow */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-neutral-200">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
                TENANT ESCROW LEDGER
              </span>
              <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
                Distribusi Saldo Escrow &amp; Status Tenant
              </h2>
            </div>
            <Link
              href="/superadmin/tenants"
              className="px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1 self-start transition-colors"
            >
              Manajemen Tenant
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stores.map((store) => {
              const barPct = Math.max(
                4,
                Math.round((store.balance / maxStoreBalance) * 100)
              );
              return (
                <div
                  key={store.id}
                  className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-semibold text-base text-[#0A0A0A]">
                        {store.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          store.isOfficialStore
                            ? "bg-[#185B37] text-white border-[#185B37]"
                            : "bg-white text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {store.isOfficialStore ? "OFFICIAL STORE" : "STAR SELLER"}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          store.status === "ACTIVE"
                            ? "bg-white text-[#185B37] border-[#185B37]"
                            : store.status === "PENDING"
                            ? "bg-[#9E2A2B] text-white border-[#9E2A2B]"
                            : "bg-neutral-900 text-white border-neutral-900"
                        }`}
                      >
                        {store.status}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-neutral-400 mr-1.5 uppercase">
                        ESCROW:
                      </span>
                      <span className="text-xs font-bold text-[#0A0A0A]">
                        {formatIDR(store.balance)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-neutral-200 overflow-hidden">
                    <div
                      className={`h-full ${
                        store.status === "ACTIVE"
                          ? "bg-[#185B37]"
                          : "bg-[#9E2A2B]"
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500">
                    <span>
                      Owner: <strong className="text-[#0A0A0A]">{store.owner?.name}</strong> ({store.city})
                    </span>
                    <span className="font-mono text-[10px]">
                      <strong>{store.productCount}</strong> SKU •{" "}
                      <strong>{store.subOrderCount}</strong> SUBORDER
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Action Items Queue for Superadmin */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
                ACTION QUEUE
              </span>
              <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
                Otorisasi Eksekutif
              </h2>
            </div>

            {/* Pending Store Approval */}
            <div className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                  01. Approval Toko Baru
                </span>
                <span className="px-2 py-0.5 bg-[#9E2A2B] text-white font-mono text-[9px] font-bold">
                  {metrics.pendingStoresCount} PENDING
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Terdapat <strong>{metrics.pendingStoresCount} tenant</strong> menunggu
                otorisasi agar katalognya tayang di beranda publik.
              </p>
              <Link
                href="/superadmin/tenants"
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#185B37] hover:underline pt-1"
              >
                Tinjau &amp; Setujui Tenant →
              </Link>
            </div>

            {/* Pending Escrow Withdrawal */}
            <div className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                  02. Pencairan Saldo Escrow
                </span>
                <span className="px-2 py-0.5 bg-[#185B37] text-white font-mono text-[9px] font-bold">
                  {withdrawals.filter((w) => w.status === "PENDING").length} REQ
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Total pengajuan pencairan menunggu persetujuan:{" "}
                <strong className="font-mono text-[#0A0A0A]">
                  {formatIDR(metrics.pendingWithdrawalsAmount)}
                </strong>
                .
              </p>
              <Link
                href="/superadmin/finance"
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#185B37] hover:underline pt-1"
              >
                Otorisasi Pencairan Dana →
              </Link>
            </div>

            {/* Global Marketing Campaign Shortcut */}
            <div className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                  03. Flash Sale &amp; Banner
                </span>
                <span className="px-2 py-0.5 bg-[#0A0A0A] text-white font-mono text-[9px] font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Kendalikan tajuk utama, durasi countdown, dan slide promosi
                beranda.
              </p>
              <Link
                href="/superadmin/marketing"
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] hover:underline pt-1"
              >
                Konfigurasi Kampanye →
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 text-[10px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>MYSQL SYNC</span>
            <span className="text-[#185B37] font-bold">● ONLINE</span>
          </div>
        </div>
      </div>

      {/* Recent Global Multi-Tenant Orders Preview */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-200 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
              CROSS-TENANT TRANSACTION LOG
            </span>
            <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
              Transaksi Lintas Toko Terbaru (Master Order &amp; SubOrder)
            </h2>
          </div>
          <Link
            href="/superadmin/finance"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#185B37] hover:underline flex items-center gap-1"
          >
            Buka Buku Besar Finance
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#FAFAFA] text-neutral-500 uppercase tracking-[0.16em] text-[10px]">
                <th className="py-3 px-3">ID Master Order</th>
                <th className="py-3 px-3">Pembeli</th>
                <th className="py-3 px-3">Pecahan SubOrder per Tenant</th>
                <th className="py-3 px-3 text-right">Total GMV Order</th>
                <th className="py-3 px-3 text-right">
                  Komisi ({metrics.commissionRatePercent}%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.slice(0, 5).map((order) => {
                const commission = Math.round(
                  order.totalAmount * (metrics.commissionRatePercent / 100)
                );
                return (
                  <tr key={order.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#0A0A0A]">
                      {order.id}
                      <div className="text-[10px] font-normal text-neutral-400">
                        {new Date(order.createdAt).toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#0A0A0A]">
                        {order.buyer?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {order.buyer?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {order.subOrders.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-[10px] font-mono"
                          >
                            <strong className="text-[#0A0A0A] font-sans">
                              {sub.store?.name}
                            </strong>
                            <span className="text-neutral-300">|</span>
                            <span className="font-bold text-[#185B37]">
                              {sub.orderStatus}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#0A0A0A] font-mono">
                      {formatIDR(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#185B37] font-mono">
                      +{formatIDR(commission)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
