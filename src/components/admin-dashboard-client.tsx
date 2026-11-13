"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Store,
  BadgeCheck,
  Star,
  TrendingUp,
  GitFork,
  Loader2,
  MapPin,
} from "lucide-react";
import type { EnrichedOrder } from "@/lib/prisma";
import { SeedStore, SeedUser, StoreStatusType } from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

export function AdminDashboardClient({
  stores,
  orders,
}: {
  stores: (SeedStore & {
    owner: SeedUser;
    productCount: number;
    subOrderCount: number;
  })[];
  orders: EnrichedOrder[];
}) {
  const router = useRouter();
  const [loadingStoreId, setLoadingStoreId] = useState<string | null>(null);

  const totalGMV = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalSubOrders = orders.reduce(
    (acc, o) => acc + o.subOrders.length,
    0
  );

  const handleStoreUpdate = async (
    storeId: string,
    payload: { status?: StoreStatusType; isOfficialStore?: boolean }
  ) => {
    setLoadingStoreId(storeId);
    try {
      await fetch("/api/admin/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, ...payload }),
      });
      router.refresh();
    } finally {
      setLoadingStoreId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Superadmin Header */}
      <div
        id="superadmin-console-header"
        className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              SUPERADMIN PLATFORM GOVERNANCE • GLOBAL MULTI-TENANT VIEW
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              FashionHub Central Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Kelola seluruh Tenant (<code className="font-mono">Store</code>),
              verifikasi status <code className="font-mono">PENDING</code> /{" "}
              <code className="font-mono">ACTIVE</code> /{" "}
              <code className="font-mono">SUSPENDED</code>, berikan badge{" "}
              <strong>Official Store</strong>, dan pantau pemecahan transaksi{" "}
              <code className="font-mono">Order → SubOrder</code>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-purple-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Total GMV Platform
              </div>
              <div className="text-base md:text-lg font-extrabold text-emerald-300 mt-1">
                {formatIDR(totalGMV)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-purple-200 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                Total Tenant Terdaftar
              </div>
              <div className="text-base md:text-lg font-extrabold text-white mt-1">
                {stores.length} Toko
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <div className="text-[11px] text-purple-200 flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-purple-300" />
                Master / SubOrder
              </div>
              <div className="text-base md:text-lg font-extrabold text-white mt-1">
                {orders.length} / {totalSubOrders}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Moderation Table */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Manajemen Tenant / Toko (Tabel Store MySQL)
            </h2>
            <p className="text-xs text-slate-500">
              Moderasi status toko dan pengaturan badge Official Store
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold border-y border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tenant / Store</th>
                <th className="py-3.5 px-4">Owner (STORE_ADMIN)</th>
                <th className="py-3.5 px-4">Tier Badge</th>
                <th className="py-3.5 px-4">Saldo (Balance)</th>
                <th className="py-3.5 px-4">SKU / SubOrder</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/80">
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {store.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {store.city} •{" "}
                      <code className="font-mono bg-slate-100 px-1 rounded">
                        {store.id}
                      </code>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">
                      {store.owner?.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {store.owner?.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleStoreUpdate(store.id, {
                          isOfficialStore: !store.isOfficialStore,
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        store.isOfficialStore
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {store.isOfficialStore ? (
                        <>
                          <BadgeCheck className="w-3.5 h-3.5 text-purple-600" />
                          Official Store
                        </>
                      ) : (
                        <>
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          Star Seller
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 font-extrabold text-emerald-700">
                    {formatIDR(store.balance)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-800">
                      {store.productCount} Produk
                    </span>{" "}
                    •{" "}
                    <span className="text-slate-500">
                      {store.subOrderCount} SubOrder
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                        store.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : store.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {store.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {loadingStoreId === store.id && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      )}
                      {(["ACTIVE", "PENDING", "SUSPENDED"] as StoreStatusType[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              handleStoreUpdate(store.id, { status: st })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                              store.status === st
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {st}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Global Master Order & SubOrder Audit Log */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Audit Transaksi Multi-Tenant (Order → SubOrder Split)
          </h2>
          <p className="text-xs text-slate-500">
            Memantau seluruh transaksi lintas toko secara real-time
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    {ord.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    oleh <strong>{ord.buyer?.name}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {ord.paymentStatus}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Total Master Order: {formatIDR(ord.totalAmount)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ord.subOrders.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900">
                        {sub.store?.name}{" "}
                        <code className="font-mono text-[10px] text-slate-500">
                          ({sub.storeId})
                        </code>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sub.id} • {sub.shippingCourier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-700">
                        {formatIDR(sub.subTotal + sub.shippingCost)}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sub.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

