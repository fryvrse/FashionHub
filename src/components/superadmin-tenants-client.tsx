"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Ban,
  MapPin,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { SeedStore, SeedUser, StoreStatusType } from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

type EnrichedStoreRow = SeedStore & {
  owner: SeedUser;
  productCount: number;
  subOrderCount: number;
};

export function SuperadminTenantsClient({
  initialStores,
}: {
  initialStores: EnrichedStoreRow[];
}) {
  const router = useRouter();
  const [stores, setStores] = useState<EnrichedStoreRow[]>(initialStores);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleModerateStore = async (params: {
    storeId: string;
    storeName: string;
    status?: StoreStatusType;
    isOfficialStore?: boolean;
  }) => {
    setLoadingId(params.storeId);
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: params.storeId,
          status: params.status,
          isOfficialStore: params.isOfficialStore,
        }),
      });
      const data = await res.json();
      if (data.success && data.stores) {
        setStores(data.stores);
        if (params.status === "ACTIVE") {
          showToast(
            `Toko "${params.storeName}" disetujui menjadi ACTIVE! Produk toko kini tampil di katalog beranda pembeli.`
          );
        } else if (params.status === "SUSPENDED") {
          showToast(
            `Toko "${params.storeName}" di-SUSPEND! Seluruh produk toko otomatis disembunyikan dari katalog publik.`
          );
        } else if (typeof params.isOfficialStore === "boolean") {
          showToast(
            `Tier "${params.storeName}" diubah menjadi ${
              params.isOfficialStore ? "Official Store" : "Star Seller"
            }.`
          );
        }
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to moderate store", e);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredStores = stores.filter((s) =>
    statusFilter === "ALL" ? true : s.status === statusFilter
  );

  const pendingCount = stores.filter((s) => s.status === "PENDING").length;
  const activeCount = stores.filter((s) => s.status === "ACTIVE").length;
  const suspendedCount = stores.filter((s) => s.status === "SUSPENDED").length;

  return (
    <div className="space-y-5" data-testid="superadmin-tenants-view">
      {toastMessage && (
        <div
          className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] flex items-center justify-between gap-3 text-xs"
          data-testid="tenant-moderation-toast"
        >
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-[#185B37] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1 flex-shrink-0"
          >
            Lihat Beranda <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Filter Bar & Summary */}
      <div className="bg-white border border-neutral-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
            TENANT REGISTRY &amp; CATALOG MODERATION
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A] mt-0.5">
            Manajemen Tenant / Toko
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Setujui toko baru berstatus{" "}
            <code className="font-mono font-bold text-[#9E2A2B]">PENDING</code>,
            kelola badge <strong>Official Store / Star Seller</strong>, atau{" "}
            <strong>Suspend Toko</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: `Semua (${stores.length})` },
            { key: "ACTIVE", label: `ACTIVE (${activeCount})` },
            { key: "PENDING", label: `PENDING (${pendingCount})` },
            { key: "SUSPENDED", label: `SUSPENDED (${suspendedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors border ${
                statusFilter === tab.key
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0A0A0A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-neutral-200 text-neutral-500 uppercase tracking-[0.16em] text-[10px]">
                <th className="py-3.5 px-4">Identitas Tenant / Toko</th>
                <th className="py-3.5 px-4">Pemilik (STORE_ADMIN)</th>
                <th className="py-3.5 px-4">Tier Badge Toko</th>
                <th className="py-3.5 px-4">Katalog &amp; Transaksi</th>
                <th className="py-3.5 px-4 text-right">Saldo Escrow</th>
                <th className="py-3.5 px-4">Status Tenant</th>
                <th className="py-3.5 px-4 text-right">Aksi Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredStores.map((store) => {
                const isBusy = loadingId === store.id;
                return (
                  <tr
                    key={store.id}
                    data-testid={`tenant-row-${store.id}`}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    {/* Store Info */}
                    <td className="py-4 px-4">
                      <div className="font-serif text-base font-semibold text-[#0A0A0A]">
                        {store.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#185B37]" />
                          {store.city}
                        </span>
                        <span>•</span>
                        <code className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                          {store.id}
                        </code>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#0A0A0A]">
                        {store.owner?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {store.owner?.email}
                      </div>
                    </td>

                    {/* Badge Tier Toggle */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                            store.isOfficialStore
                              ? "bg-[#185B37] text-white border-[#185B37]"
                              : "bg-neutral-100 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          {store.isOfficialStore
                            ? "● OFFICIAL STORE"
                            : "★ STAR SELLER"}
                        </span>

                        <button
                          type="button"
                          disabled={isBusy}
                          data-testid={`toggle-badge-${store.id}`}
                          onClick={() =>
                            handleModerateStore({
                              storeId: store.id,
                              storeName: store.name,
                              isOfficialStore: !store.isOfficialStore,
                            })
                          }
                          className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 hover:text-[#0A0A0A] underline underline-offset-4 disabled:opacity-50"
                        >
                          {store.isOfficialStore
                            ? "Ubah ke Star Seller"
                            : "Jadikan Official Store"}
                        </button>
                      </div>
                    </td>

                    {/* Catalog & SubOrders */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-[#0A0A0A]">
                        {store.productCount} SKU
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {store.subOrderCount} SUBORDER
                      </div>
                      {store.status !== "ACTIVE" && (
                        <div className="text-[9px] font-bold text-[#9E2A2B] uppercase mt-0.5">
                          TERSEMBUNYI DARI PUBLIK
                        </div>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#0A0A0A]">
                      {formatIDR(store.balance)}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-4">
                      <span
                        data-testid={`status-badge-${store.id}`}
                        className={`inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                          store.status === "ACTIVE"
                            ? "bg-white text-[#185B37] border-[#185B37]"
                            : store.status === "PENDING"
                            ? "bg-[#9E2A2B] text-white border-[#9E2A2B]"
                            : "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                        }`}
                      >
                        {store.status}
                      </span>
                    </td>

                    {/* Moderation Action Buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {store.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            data-testid={`approve-store-${store.id}`}
                            onClick={() =>
                              handleModerateStore({
                                storeId: store.id,
                                storeName: store.name,
                                status: "ACTIVE",
                              })
                            }
                            className="px-3.5 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Approve Toko Baru
                          </button>
                        )}

                        {store.status === "ACTIVE" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            data-testid={`suspend-store-${store.id}`}
                            onClick={() =>
                              handleModerateStore({
                                storeId: store.id,
                                storeName: store.name,
                                status: "SUSPENDED",
                              })
                            }
                            className="px-3.5 py-2 bg-white hover:bg-[#9E2A2B] text-[#9E2A2B] hover:text-white border border-[#9E2A2B] text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            Suspend Toko
                          </button>
                        )}

                        {store.status === "SUSPENDED" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            data-testid={`reactivate-store-${store.id}`}
                            onClick={() =>
                              handleModerateStore({
                                storeId: store.id,
                                storeName: store.name,
                                status: "ACTIVE",
                              })
                            }
                            className="px-3.5 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Aktifkan Kembali
                          </button>
                        )}
                      </div>
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
