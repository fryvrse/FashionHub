"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Truck,
  ArrowDownRight,
} from "lucide-react";
import type { EnrichedOrder, EnrichedWithdrawal } from "@/lib/prisma";
import type { SeedStore, WithdrawalStatusType } from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

export function SuperadminFinanceClient({
  initialOrders,
  initialWithdrawals,
  initialStores,
  commissionRatePercent,
}: {
  initialOrders: EnrichedOrder[];
  initialWithdrawals: EnrichedWithdrawal[];
  initialStores: SeedStore[];
  commissionRatePercent: number;
}) {
  const router = useRouter();
  const [withdrawals, setWithdrawals] =
    useState<EnrichedWithdrawal[]>(initialWithdrawals);
  const [stores, setStores] = useState<SeedStore[]>(initialStores);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleProcessWithdrawal = async (
    withdrawalId: string,
    status: WithdrawalStatusType
  ) => {
    setProcessingId(withdrawalId);
    try {
      const res = await fetch("/api/superadmin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
        if (data.stores) setStores(data.stores);
        setToastMsg(
          status === "APPROVED"
            ? `Pencairan #${withdrawalId} DISETUJUI! Dana telah ditransfer ke rekening toko dan saldo Escrow dipotong.`
            : `Pencairan #${withdrawalId} DITOLAK.`
        );
        setTimeout(() => setToastMsg(null), 4000);
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to process withdrawal", e);
    } finally {
      setProcessingId(null);
    }
  };

  const totalEscrow = stores.reduce((sum, s) => sum + s.balance, 0);
  const totalGMV = initialOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = Math.round(
    totalGMV * (commissionRatePercent / 100)
  );
  const pendingWithdrawalsTotal = withdrawals
    .filter((w) => w.status === "PENDING")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6" data-testid="superadmin-finance-view">
      {toastMsg && (
        <div
          className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] flex items-center gap-2.5 text-xs"
          data-testid="finance-toast"
        >
          <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Top Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            01 / Total Saldo Escrow Seluruh Toko
          </span>
          <div
            className="text-2xl font-bold text-[#0A0A0A] font-mono mt-2"
            data-testid="finance-total-escrow"
          >
            {formatIDR(totalEscrow)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Dana penjual tertahan di rekening penampungan
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            02 / Total Komisi Platform ({commissionRatePercent}% GMV)
          </span>
          <div className="text-2xl font-bold text-[#185B37] font-mono mt-2">
            {formatIDR(totalCommission)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Dari total GMV lintas toko sebesar {formatIDR(totalGMV)}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            03 / Antrean Pencairan (Pending)
          </span>
          <div className="text-2xl font-bold text-[#9E2A2B] font-mono mt-2">
            {formatIDR(pendingWithdrawalsTotal)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {withdrawals.filter((w) => w.status === "PENDING").length} permintaan
            menunggu otorisasi Superadmin
          </p>
        </div>
      </div>

      {/* Section 1: Escrow Withdrawal Approval Panel */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="border-b border-neutral-200 pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
            ESCROW DISBURSEMENT CONTROL
          </span>
          <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
            Panel Persetujuan Pencairan Saldo (Withdrawal)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-neutral-200 text-neutral-500 uppercase tracking-[0.16em] text-[10px]">
                <th className="py-3 px-4">ID Pencairan</th>
                <th className="py-3 px-4">Tenant / Toko</th>
                <th className="py-3 px-4">Rekening Tujuan</th>
                <th className="py-3 px-4 text-right">Saldo Toko Saat Ini</th>
                <th className="py-3 px-4 text-right">Nominal Pencairan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Otorisasi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {withdrawals.map((wd) => {
                const isBusy = processingId === wd.id;
                const liveStore =
                  stores.find((s) => s.id === wd.storeId) || wd.store;
                return (
                  <tr
                    key={wd.id}
                    data-testid={`withdrawal-row-${wd.id}`}
                    className="hover:bg-[#FAFAFA]"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-[#0A0A0A]">
                      {wd.id}
                      <div className="text-[10px] font-normal text-neutral-400">
                        {new Date(wd.requestedAt).toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#0A0A0A]">
                        {liveStore?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {wd.notes}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono font-semibold text-[#0A0A0A]">
                        {wd.bankName} • {wd.accountNumber}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        a.n. {wd.accountHolder}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-neutral-600">
                      {formatIDR(liveStore?.balance ?? 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#185B37] text-xs">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {formatIDR(wd.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          wd.status === "APPROVED"
                            ? "bg-white text-[#185B37] border-[#185B37]"
                            : wd.status === "PENDING"
                            ? "bg-[#9E2A2B] text-white border-[#9E2A2B]"
                            : "bg-neutral-200 text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {wd.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {wd.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            data-testid={`approve-withdrawal-${wd.id}`}
                            onClick={() =>
                              handleProcessWithdrawal(wd.id, "APPROVED")
                            }
                            className="px-3 py-1.5 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isBusy && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            Setujui &amp; Cairkan
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleProcessWithdrawal(wd.id, "REJECTED")
                            }
                            className="px-2.5 py-1.5 bg-white hover:bg-[#9E2A2B] text-[#9E2A2B] hover:text-white border border-[#9E2A2B] text-[10px] font-semibold uppercase tracking-[0.14em]"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono uppercase text-neutral-400">
                          SELESAI
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Global Multi-Tenant Order & SubOrder Ledger */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="border-b border-neutral-200 pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
            MASTER &amp; SUBORDER LEDGER
          </span>
          <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
            Buku Besar Transaksi Lintas Toko
          </h2>
        </div>

        <div className="space-y-4">
          {initialOrders.map((order) => {
            const orderCommission = Math.round(
              order.totalAmount * (commissionRatePercent / 100)
            );
            return (
              <div
                key={order.id}
                data-testid={`global-order-${order.id}`}
                className="border border-neutral-200"
              >
                <div className="bg-[#0A0A0A] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-white">
                      {order.id}
                    </span>
                    <span className="text-neutral-600">/</span>
                    <span>
                      Buyer: <strong>{order.buyer?.name}</strong> (
                      {order.buyer?.email})
                    </span>
                    <span className="px-2 py-0.5 bg-[#185B37] text-white font-mono text-[9px] font-bold">
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>
                      TOTAL: <strong>{formatIDR(order.totalAmount)}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-200 text-[10px]">
                      KOMISI {commissionRatePercent}%:{" "}
                      {formatIDR(orderCommission)}
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#FAFAFA]">
                  {order.subOrders.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white border border-neutral-200 p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-[#0A0A0A]">
                            {sub.id}
                          </span>
                          <span className="mx-1.5 text-neutral-300">|</span>
                          <strong className="text-[#185B37]">
                            {sub.store?.name}
                          </strong>
                        </div>
                        <span className="px-2 py-0.5 bg-[#FAFAFA] border border-neutral-300 font-mono text-[9px] font-bold uppercase">
                          {sub.orderStatus}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-neutral-600">
                        {sub.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate pr-2">
                              {it.quantity}x {it.variant?.product?.name} (
                              {it.variant?.size} • {it.variant?.color})
                            </span>
                            <span className="font-mono font-semibold text-[#0A0A0A]">
                              {formatIDR(it.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-[#185B37]" />
                          {sub.shippingCourier}
                          {sub.trackingNumber
                            ? ` • Resi: ${sub.trackingNumber}`
                            : ""}
                        </span>
                        <span className="font-mono font-bold text-[#0A0A0A]">
                          Subtotal: {formatIDR(sub.subTotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
