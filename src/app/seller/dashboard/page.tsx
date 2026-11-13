import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";

export default function SellerDashboardPage({
  searchParams,
}: {
  searchParams: { guard?: string; from?: string };
}) {
  const session = getCurrentSession();
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    redirect("/");
  }

  // STRICT PRISMA MULTI-TENANT ISOLATION: All queries filtered by session.storeId
  const store = db.getStoreById(session.storeId);
  if (!store) redirect("/");

  const analytics = db.getStoreAnalytics(session.storeId);
  const recentSubOrders = db.getSubOrdersByStore(session.storeId).slice(0, 4);
  const storeProducts = db.getProducts({ storeId: session.storeId }).slice(0, 4);

  const maxDailyRevenue = Math.max(
    ...analytics.weeklySalesTrend.map((d) => d.revenue),
    1
  );

  return (
    <div className="space-y-6" data-testid="seller-dashboard-view">
      {/* RBAC Guard Banner if redirected from non-seller route */}
      {searchParams.from && (
        <div
          id="tenant-guard-banner"
          className="p-3.5 bg-white border border-[#9E2A2B] text-[#0A0A0A] text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#9E2A2B] flex-shrink-0" />
            <span>
              <strong className="uppercase tracking-wider text-[#9E2A2B]">
                Middleware RBAC Guard:
              </strong>{" "}
              Sebagai <code className="font-mono font-bold">STORE_ADMIN</code>,
              akses ke <code className="font-mono">{searchParams.from}</code>{" "}
              dikunci ke Seller Center dengan filter{" "}
              <code className="font-mono font-bold">
                WHERE storeId = &quot;{store.id}&quot;
              </code>
              .
            </span>
          </div>
        </div>
      )}

      {/* 4 Architectural Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo Toko (Escrow) */}
        <div
          data-testid="metric-escrow-balance"
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            01 / Total Saldo Toko (Escrow)
          </span>
          <div className="mt-4">
            <div className="font-mono text-2xl font-bold text-[#0A0A0A]">
              {formatIDR(analytics.escrowBalance)}
            </div>
            <p className="text-[11px] text-[#185B37] font-medium mt-1">
              ● Dana siap dicairkan ke rekening toko
            </p>
          </div>
        </div>

        {/* Card 2: Total Pesanan Masuk (NEW) */}
        <div
          data-testid="metric-new-orders"
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            02 / Pesanan Masuk (NEW)
          </span>
          <div className="mt-4">
            <div className="font-mono text-2xl font-bold text-[#0A0A0A]">
              {analytics.newOrdersCount} Pesanan Baru
            </div>
            <Link
              href="/seller/orders"
              className="text-[11px] text-[#9E2A2B] hover:underline font-semibold mt-1 inline-flex items-center gap-1"
            >
              Proses &amp; kemas ({analytics.packingOrdersCount} dikemas)
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Jumlah Produk Aktif */}
        <div
          data-testid="metric-active-products"
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            03 / Katalog Produk Aktif
          </span>
          <div className="mt-4">
            <div className="font-mono text-2xl font-bold text-[#0A0A0A]">
              {analytics.activeProductsCount} SKU Produk
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Total inventaris varian:{" "}
              <strong className="font-mono text-[#0A0A0A]">
                {analytics.totalVariantsStock} pcs
              </strong>
            </p>
          </div>
        </div>

        {/* Card 4: Total Pendapatan Bulan Ini */}
        <div
          data-testid="metric-monthly-revenue"
          className="bg-white border border-neutral-200 p-5 flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            04 / Pendapatan Bulan Ini
          </span>
          <div className="mt-4">
            <div className="font-mono text-2xl font-bold text-[#185B37]">
              {formatIDR(analytics.monthlyRevenue)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Akumulasi 7 hari terakhir (+18.4%)
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Weekly Sales Chart + Recent SubOrders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Sales Trend Chart (7 Columns) */}
        <div
          data-testid="weekly-sales-chart"
          className="lg:col-span-7 bg-white border border-neutral-200 p-6 flex flex-col justify-between space-y-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
                WEEKLY REVENUE TELEMETRY
              </span>
              <h2 className="font-serif text-xl font-semibold text-[#0A0A0A] mt-0.5">
                Tren Penjualan Mingguan — {store.name}
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-[#FAFAFA] border border-neutral-200 text-neutral-700 px-2 py-0.5">
              storeId: {store.id}
            </span>
          </div>

          {/* Minimalist Architectural Bar Chart (Solid Carbon & Bottle Green) */}
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-3 items-end h-52 pt-6 px-2 border-b border-neutral-200">
              {analytics.weeklySalesTrend.map((item, idx) => {
                const heightPercent = Math.max(
                  18,
                  Math.round((item.revenue / maxDailyRevenue) * 100)
                );
                const isToday = idx === analytics.weeklySalesTrend.length - 1;

                return (
                  <div
                    key={item.day}
                    className="flex flex-col items-center justify-end h-full group"
                  >
                    <div className="font-mono text-[10px] font-semibold text-neutral-600 mb-1.5 text-center">
                      {Math.round(item.revenue / 1000)}k
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[40px] transition-colors relative ${
                        isToday
                          ? "bg-[#185B37]"
                          : "bg-[#0A0A0A] group-hover:bg-neutral-700"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="grid grid-cols-7 gap-3 pt-2.5 text-center font-mono">
              {analytics.weeklySalesTrend.map((item, idx) => {
                const isToday = idx === analytics.weeklySalesTrend.length - 1;
                return (
                  <div key={item.day}>
                    <div
                      className={`text-xs font-bold ${
                        isToday ? "text-[#185B37]" : "text-[#0A0A0A]"
                      }`}
                    >
                      {item.day}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {item.orders} trx
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FAFAFA] p-3.5 border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-neutral-600">
              Puncak volume minggu ini:{" "}
              <strong className="font-mono text-[#0A0A0A]">
                {formatIDR(maxDailyRevenue)}
              </strong>
            </span>
            <Link
              href="/seller/orders"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#185B37] hover:underline flex items-center gap-1"
            >
              Buka Antrean SubOrder <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Incoming SubOrders Quick Action List */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-baseline justify-between border-b border-neutral-200 pb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
                DISPATCH QUEUE
              </span>
              <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
                SubOrder Terbaru
              </h2>
            </div>
            <Link
              href="/seller/orders"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 hover:text-[#0A0A0A] flex items-center gap-1"
            >
              Semua <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentSubOrders.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-[#FAFAFA] border border-neutral-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0A0A0A]">
                    {sub.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider border ${
                      sub.orderStatus === "NEW"
                        ? "bg-[#9E2A2B] text-white border-[#9E2A2B]"
                        : sub.orderStatus === "PACKING"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-[#185B37]/10 text-[#185B37] border-[#185B37]/30"
                    }`}
                  >
                    {sub.orderStatus}
                  </span>
                </div>

                <div className="text-xs text-neutral-600 flex items-center justify-between">
                  <span>
                    Buyer: <strong className="text-[#0A0A0A]">{sub.order?.buyer?.name}</strong>
                  </span>
                  <span className="font-mono font-bold text-[#0A0A0A]">
                    {formatIDR(sub.subTotal)}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-1 border-t border-neutral-200">
                  <span className="flex items-center gap-1 truncate">
                    <Truck className="w-3 h-3 text-[#185B37] flex-shrink-0" />
                    {sub.shippingCourier}
                  </span>
                  {sub.trackingNumber && (
                    <span className="font-mono text-[10px] text-[#0A0A0A] font-semibold">
                      {sub.trackingNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/seller/orders"
            className="w-full py-2.5 px-4 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-semibold uppercase tracking-[0.16em] text-center transition-colors block"
          >
            Kelola Pesanan &amp; Input Resi
          </Link>
        </div>
      </div>

      {/* Store Exclusive Product Snapshot */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
              Arsip Katalog Aktif — {store.name}
            </h2>
            <p className="text-xs text-neutral-500">
              Terisolasi pada{" "}
              <code className="font-mono font-semibold text-[#0A0A0A]">
                storeId = &quot;{store.id}&quot;
              </code>
            </p>
          </div>
          <Link
            href="/seller/products"
            className="px-4 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] flex items-center gap-1.5 transition-colors"
          >
            Manajemen Produk <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storeProducts.map((prod) => {
            const totalStock = prod.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <div
                key={prod.id}
                className="p-3 border border-neutral-200 flex items-center gap-3 bg-[#FAFAFA]"
              >
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-12 h-16 object-cover border border-neutral-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[#0A0A0A] truncate">
                    {prod.name}
                  </div>
                  <div className="font-mono text-xs font-bold text-[#0A0A0A] mt-0.5">
                    {formatIDR(prod.discountPrice ?? prod.basePrice)}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    {prod.variants.length} VAR • {totalStock} PCS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
