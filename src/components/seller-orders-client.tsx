"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Truck,
  Check,
  Loader2,
  Lock,
  FileText,
  Sparkles,
  Navigation,
  Receipt,
  MapPin,
} from "lucide-react";
import type { EnrichedSubOrder } from "@/lib/prisma";
import {
  OrderStatusType,
  SeedStore,
  generateAutoResi,
} from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";
import {
  ShipmentTrackingModal,
  OrderDetailInvoiceModal,
} from "@/components/order-tracking-modals";

const FILTER_TABS: { key: "ALL" | OrderStatusType; label: string }[] = [
  { key: "ALL", label: "Semua SubOrder" },
  { key: "NEW", label: "Pesanan Baru (NEW)" },
  { key: "PACKING", label: "Sedang Dikemas (PACKING)" },
  { key: "SHIPPED", label: "Dalam Pengiriman (SHIPPED)" },
  { key: "COMPLETED", label: "Selesai (COMPLETED)" },
];

export function SellerOrdersClient({
  store,
  initialSubOrders,
}: {
  store: SeedStore;
  initialSubOrders: EnrichedSubOrder[];
}) {
  const router = useRouter();
  const [subOrders, setSubOrders] =
    useState<EnrichedSubOrder[]>(initialSubOrders);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatusType>(
    "ALL"
  );
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>(
    {}
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [trackingModalSub, setTrackingModalSub] =
    useState<EnrichedSubOrder | null>(null);
  const [detailModalSub, setDetailModalSub] =
    useState<EnrichedSubOrder | null>(null);

  React.useEffect(() => {
    setSubOrders(initialSubOrders);
  }, [initialSubOrders]);

  const getDefaultResi = (sub: EnrichedSubOrder) => {
    if (trackingInputs[sub.id] !== undefined) return trackingInputs[sub.id];
    if (sub.trackingNumber) return sub.trackingNumber;
    return generateAutoResi(sub.shippingCourier, sub.id);
  };

  const handleAutoGenerateResi = (sub: EnrichedSubOrder) => {
    const prefix = sub.shippingCourier
      .toUpperCase()
      .includes("SICEPAT")
      ? "SCP"
      : sub.shippingCourier.toUpperCase().includes("J&T")
      ? "JNT"
      : "JNE";
    const randomDigits = Math.floor(1000000000 + Math.random() * 8999999999);
    const generated = `${prefix}${randomDigits}ID`;
    setTrackingInputs((prev) => ({
      ...prev,
      [sub.id]: generated,
    }));
  };

  const syncSubOrder = (updated: EnrichedSubOrder) => {
    setSubOrders((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
    setTrackingModalSub((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev
    );
    setDetailModalSub((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev
    );
    router.refresh();
  };

  const handleTransitionStatus = async (
    sub: EnrichedSubOrder,
    nextStatus: OrderStatusType,
    trackingNumber?: string
  ) => {
    setLoadingId(sub.id);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: sub.id,
          orderStatus: nextStatus,
          trackingNumber,
          shippingCourier: sub.shippingCourier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.subOrder) {
          syncSubOrder(data.subOrder);
        } else {
          setSubOrders((prev) =>
            prev.map((item) =>
              item.id === sub.id
                ? {
                    ...item,
                    orderStatus: nextStatus,
                    trackingNumber: trackingNumber || item.trackingNumber,
                  }
                : item
            )
          );
          router.refresh();
        }
        setFeedback(
          nextStatus === "PACKING"
            ? `SubOrder ${sub.id} diterima & masuk tahap pengemasan (PACKING).`
            : nextStatus === "SHIPPED"
            ? `SubOrder ${sub.id} berhasil dikirim (SHIPPED) dengan No. Resi: ${
                data.trackingNumber || trackingNumber
              }!`
            : `Status SubOrder ${sub.id} diperbarui menjadi ${nextStatus}.`
        );
        setTimeout(() => setFeedback(null), 5000);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleAdvanceCheckpoint = async (sub: EnrichedSubOrder) => {
    setLoadingId(sub.id);
    try {
      const res = await fetch("/api/orders/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: sub.id,
          action: "ADVANCE_CHECKPOINT",
        }),
      });
      const data = await res.json();
      if (data.success && data.subOrder) {
        syncSubOrder(data.subOrder);
        const latest = data.subOrder.trackingLogs?.[0];
        setFeedback(
          `Posisi kurir SubOrder ${sub.id} maju ke checkpoint: ${
            latest?.hubName || data.subOrder.orderStatus
          } — "${latest?.title || ""}"`
        );
        setTimeout(() => setFeedback(null), 5000);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = subOrders.filter((s) =>
    statusFilter === "ALL" ? true : s.orderStatus === statusFilter
  );

  return (
    <div className="space-y-5" data-testid="seller-orders-view">
      {/* Header Banner */}
      <div className="bg-white border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#185B37] font-semibold mb-1">
            <Lock className="w-3 h-3" />
            ISOLATED SUBORDER QUEUE • WHERE storeId = &quot;{store.id}&quot;
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
            Manajemen Pesanan Masuk &amp; Pengiriman Kurir — {store.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Menampilkan <strong>{subOrders.length} SubOrder</strong> khusus
            tenant Anda ({store.city}) lengkap dengan fitur{" "}
            <strong className="text-[#185B37]">Auto-Generate Resi</strong> &amp;{" "}
            <strong className="text-[#185B37]">Simulasi Pergerakan Kurir</strong>.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? subOrders.length
              : subOrders.filter((s) => s.orderStatus === tab.key).length;
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors flex items-center gap-2 border ${
                active
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0A0A0A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 font-mono text-[10px] ${
                  active
                    ? "bg-[#185B37] text-white font-bold"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          id="order-status-feedback"
          className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] text-xs font-medium flex items-center gap-2.5"
        >
          <Check className="w-4 h-4 text-[#4ADE80] flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SubOrder List */}
      <div className="space-y-4">
        {filtered.map((sub) => {
          const isProcessing = loadingId === sub.id;
          const currentResi = getDefaultResi(sub);
          const latestLog = sub.trackingLogs?.[0];

          return (
            <div
              key={sub.id}
              data-testid={`seller-suborder-card-${sub.id}`}
              className="bg-white border border-neutral-200 p-5 space-y-4"
            >
              {/* SubOrder Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-[#0A0A0A]">{sub.id}</span>
                    <span className="text-neutral-300">/</span>
                    <span className="text-neutral-500">
                      MASTER: {sub.orderId}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-[#185B37] text-[10px] font-bold">
                      storeId=&quot;{sub.storeId}&quot;
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Pembeli:{" "}
                    <strong className="text-[#0A0A0A]">
                      {sub.order?.buyer?.name}
                    </strong>{" "}
                    ({sub.order?.buyer?.email}) •{" "}
                    {new Date(sub.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  data-testid={`suborder-status-badge-${sub.id}`}
                  className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                    sub.orderStatus === "NEW"
                      ? "bg-[#9E2A2B] text-white border-[#9E2A2B]"
                      : sub.orderStatus === "PACKING"
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-[#185B37]/10 text-[#185B37] border-[#185B37]/40"
                  }`}
                >
                  STATUS: {sub.orderStatus}
                </span>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-neutral-100">
                {sub.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {item.variant?.product?.images?.[0] ? (
                        <img
                          src={item.variant.product.images[0]}
                          alt={item.variant.product.name}
                          className="w-12 h-14 object-cover border border-neutral-200"
                        />
                      ) : (
                        <div className="w-12 h-14 bg-neutral-100 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[#0A0A0A] text-xs">
                          {item.variant?.product?.name}
                        </div>
                        <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                          {item.variant?.color} / SIZE {item.variant?.size} /{" "}
                          <strong className="text-[#0A0A0A]">
                            {item.quantity} PCS
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#0A0A0A] text-xs">
                      {formatIDR(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Latest Checkpoint Status Bar */}
              {latestLog && (
                <div className="px-3.5 py-2.5 bg-[#185B37]/[0.05] border border-[#185B37]/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#185B37] animate-pulse" />
                    <span className="font-mono text-[11px] font-bold text-[#185B37] uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {latestLog.hubName}:
                    </span>
                    <span className="text-[#0A0A0A] font-medium">
                      {latestLog.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500">
                    {latestLog.timestamp}
                  </span>
                </div>
              )}

              {/* Action Workflow Bar: NEW -> PACKING -> Input Resi / Auto-Generate Resi & SHIPPED */}
              <div className="pt-3.5 border-t border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FAFAFA] p-4 border">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-medium text-[#0A0A0A]">
                    <Truck className="w-3.5 h-3.5 text-[#185B37]" />
                    Kurir: {sub.shippingCourier} (Ongkir:{" "}
                    <span className="font-mono">
                      {formatIDR(sub.shippingCost)}
                    </span>
                    )
                  </div>
                  {sub.trackingNumber && (
                    <div className="flex items-center gap-1.5 text-[#185B37] font-mono font-bold text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      No. Resi (AWB): {sub.trackingNumber}
                    </div>
                  )}
                  <div className="text-[#0A0A0A] font-mono font-bold text-xs pt-0.5">
                    Net Escrow Toko: {formatIDR(sub.subTotal)}
                  </div>
                </div>

                {/* Contextual Workflow Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Lihat Detail Pesanan */}
                  <button
                    type="button"
                    onClick={() => setDetailModalSub(sub)}
                    className="px-3 py-2 border border-neutral-300 bg-white hover:border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Detail Pesanan</span>
                  </button>

                  {/* Lacak Pengiriman */}
                  <button
                    type="button"
                    data-testid={`seller-btn-track-${sub.id}`}
                    onClick={() => setTrackingModalSub(sub)}
                    className="px-3 py-2 border border-[#185B37] bg-[#185B37]/10 hover:bg-[#185B37] text-[#185B37] hover:text-white text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Lacak Pengiriman</span>
                  </button>

                  {sub.orderStatus === "NEW" && (
                    <button
                      type="button"
                      data-testid={`btn-accept-pack-${sub.id}`}
                      disabled={isProcessing}
                      onClick={() => handleTransitionStatus(sub, "PACKING")}
                      className="px-4 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-2 transition-colors"
                    >
                      {isProcessing && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Terima &amp; Kemas (PACKING)
                    </button>
                  )}

                  {sub.orderStatus === "PACKING" && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        data-testid={`input-resi-${sub.id}`}
                        value={currentResi}
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        placeholder="Input No. Resi Kurir..."
                        className="px-3 py-2 border border-neutral-300 bg-white text-xs font-mono font-bold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                      />
                      <button
                        type="button"
                        data-testid={`btn-auto-resi-${sub.id}`}
                        onClick={() => handleAutoGenerateResi(sub)}
                        className="px-3 py-2 border border-neutral-900 bg-white hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-[#185B37]" />
                        Auto-Generate Resi
                      </button>
                      <button
                        type="button"
                        data-testid={`btn-ship-order-${sub.id}`}
                        disabled={isProcessing || !currentResi.trim()}
                        onClick={() =>
                          handleTransitionStatus(
                            sub,
                            "SHIPPED",
                            currentResi.trim()
                          )
                        }
                        className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center gap-2 transition-colors"
                      >
                        {isProcessing && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        Kirim Pesanan (SHIPPED)
                      </button>
                    </div>
                  )}

                  {(sub.orderStatus === "SHIPPED" ||
                    sub.orderStatus === "COMPLETED") && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      data-testid={`seller-btn-simulate-${sub.id}`}
                      onClick={() => handleAdvanceCheckpoint(sub)}
                      className="px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
                      )}
                      <span>Simulasikan Pergerakan Kurir (Majukan Checkpoint)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Shipment Tracking Modal */}
      {trackingModalSub && (
        <ShipmentTrackingModal
          subOrder={trackingModalSub}
          onClose={() => setTrackingModalSub(null)}
          onSubOrderUpdated={syncSubOrder}
        />
      )}

      {/* Full Order Detail Invoice Modal */}
      {detailModalSub && (
        <OrderDetailInvoiceModal
          subOrder={detailModalSub}
          masterOrderId={detailModalSub.orderId}
          masterTotalAmount={
            detailModalSub.order?.totalAmount ||
            detailModalSub.subTotal + detailModalSub.shippingCost
          }
          paymentStatus={detailModalSub.order?.paymentStatus || "PAID"}
          createdAt={detailModalSub.createdAt}
          onClose={() => setDetailModalSub(null)}
          onOpenTracking={() => {
            const sub = detailModalSub;
            setDetailModalSub(null);
            setTrackingModalSub(sub);
          }}
        />
      )}
    </div>
  );
}
