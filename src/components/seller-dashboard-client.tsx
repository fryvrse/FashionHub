"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  BadgeCheck,
  Star,
  Wallet,
  Package,
  ShoppingBag,
  Lock,
  ShieldAlert,
  Truck,
  CheckCircle2,
  Loader2,
  MapPin,
} from "lucide-react";
import type { EnrichedProduct, EnrichedSubOrder } from "@/lib/prisma";
import { OrderStatusType, SeedStore, SeedUser } from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

const STATUS_FLOW: OrderStatusType[] = [
  "NEW",
  "PACKING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

export function SellerDashboardClient({
  store,
  products,
  subOrders,
  guardFrom,
}: {
  store: SeedStore & { owner: SeedUser };
  products: EnrichedProduct[];
  subOrders: EnrichedSubOrder[];
  guardFrom?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateOrderStatus = async (
    subOrderId: string,
    orderStatus: OrderStatusType
  ) => {
    setUpdatingId(subOrderId);
    try {
      await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subOrderId, orderStatus }),
      });
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Middleware Guard Alert if STORE_ADMIN attempted to visit non-seller route */}
      {guardFrom && (
        <div
          id="tenant-guard-banner"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Middleware RBAC Guard Aktif:</strong> Sebagai{" "}
              <code className="font-mono font-bold">STORE_ADMIN</code>, akses ke
              rute <code className="font-mono font-bold">{guardFrom}</code>{" "}
              diblokir dan dialihkan kembali ke{" "}
              <code className="font-mono font-bold">/seller</code>. Anda hanya
              dapat mengakses rute <code className="font-mono">/seller/*</code>{" "}
              dengan filter ketat{" "}
              <code className="font-mono font-bold">
                storeId=&quot;{store.id}&quot;
              </code>
              .
            </span>
          </div>
        </div>
      )}

      {/* Tenant Store Header Banner */}
      <div
        id="seller-tenant-header"
        className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              Row-Level Multi-Tenant Isolation • WHERE storeId = &quot;
              {store.id}&quot;
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {store.name}
              </h1>
              {store.isOfficialStore ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-extrabold uppercase">
                  <BadgeCheck className="w-4 h-4 text-purple-300" />
                  Official Store
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-extrabold uppercase">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  Star Seller
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Lokasi Toko: <strong>{store.city}</strong>
              </span>
              <span>•</span>
              <span>
                Owner: <strong>{store.owner.name}</strong> ({store.owner.email})
              </span>
              <span>•</span>
              <span>
                Status Tenant:{" "}
                <strong className="text-emerald-400">{store.status}</strong>
              </span>
            </p>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Saldo Toko (Balance)
              </div>
              <div className="text-base md:text-lg font-extrabold text-emerald-300 mt-1">
                {formatIDR(store.balance)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                SubOrder Masuk
              </div>
              <div className="text-base md:text-lg font-extrabold text-white mt-1">
                {subOrders.length} Pesanan
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                Produk Tenant
              </div>
              <div className="text-base md:text-lg font-extrabold text-white mt-1">
                {products.length} SKU
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "orders"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Pecahan Pesanan Toko (SubOrder: {subOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "products"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package className="w-4 h-4" />
          Katalog & Stok Varian ({products.length} Produk)
        </button>
      </div>

      {/* Tab 1: Isolated SubOrders for this Store */}
      {activeTab === "orders" ? (
        <div className="space-y-4">
          {subOrders.map((sub) => (
            <div
              key={sub.id}
              data-testid={`seller-suborder-card-${sub.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      SubOrder ID: {sub.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono text-slate-500">
                      Master Order: {sub.orderId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold">
                      storeId=&quot;{sub.storeId}&quot;
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Pembeli: <strong>{sub.order?.buyer?.name}</strong> (
                    {sub.order?.buyer?.email}) • Kurir:{" "}
                    <strong className="text-slate-700">
                      {sub.shippingCourier}
                    </strong>
                  </p>
                </div>

                {/* Interactive Status Changer */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">
                    Ubah Status SubOrder:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_FLOW.map((st) => {
                      const isCurrent = sub.orderStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={updatingId === sub.id}
                          onClick={() => handleUpdateOrderStatus(sub.id, st)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                            isCurrent
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {updatingId === sub.id && isCurrent ? (
                            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                          ) : null}
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* OrderItems inside this SubOrder */}
              <div className="divide-y divide-slate-100">
                {sub.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {item.variant?.product?.images?.[0] && (
                        <img
                          src={item.variant.product.images[0]}
                          alt={item.variant.product.name}
                          className="w-12 h-12 rounded-xl object-cover border"
                        />
                      )}
                      <div>
                        <div className="font-bold text-slate-900">
                          {item.variant?.product?.name}
                        </div>
                        <div className="text-slate-500">
                          Varian: <strong>{item.variant?.color}</strong> • Size:{" "}
                          <strong>{item.variant?.size}</strong> • Qty:{" "}
                          <strong>{item.quantity} pcs</strong>
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {formatIDR(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Ongkos Kirim: {formatIDR(sub.shippingCost)}
                </span>
                <span className="text-sm font-extrabold text-emerald-700">
                  Pendapatan Bersih Toko: {formatIDR(sub.subTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tab 2: Isolated Store Products & Variants */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-20 h-20 rounded-2xl object-cover border"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {prod.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 mt-1">
                    {prod.name}
                  </h3>
                  <div className="text-sm font-extrabold text-emerald-700 mt-1">
                    {formatIDR(prod.discountPrice ?? prod.basePrice)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                  Stok Varian (ProductVariant):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prod.variants.map((v) => (
                    <span
                      key={v.id}
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      <strong>{v.size}</strong> ({v.color}):{" "}
                      <span className="text-emerald-700 font-bold">
                        {v.stock}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

