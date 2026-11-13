"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  GitFork,
  Store,
  Truck,
  ShoppingBag,
  FileText,
  Navigation,
  Receipt,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import type { EnrichedOrder, EnrichedSubOrder } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import {
  ShipmentTrackingModal,
  OrderDetailInvoiceModal,
} from "@/components/order-tracking-modals";

export function BuyerOrdersClient({
  initialOrders,
}: {
  initialOrders: EnrichedOrder[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<EnrichedOrder[]>(initialOrders);
  const [trackingModalSub, setTrackingModalSub] =
    useState<EnrichedSubOrder | null>(null);
  const [detailModalContext, setDetailModalContext] = useState<{
    subOrder: EnrichedSubOrder;
    masterOrderId: string;
    masterTotalAmount: number;
    paymentStatus: string;
    createdAt: string;
  } | null>(null);
  const [completingSubId, setCompletingSubId] = useState<string | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const syncSubOrderInState = (updatedSub: EnrichedSubOrder) => {
    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        subOrders: ord.subOrders.map((s) =>
          s.id === updatedSub.id ? { ...s, ...updatedSub } : s
        ),
      }))
    );
    setTrackingModalSub((prev) =>
      prev && prev.id === updatedSub.id ? { ...prev, ...updatedSub } : prev
    );
    setDetailModalContext((prev) =>
      prev && prev.subOrder.id === updatedSub.id
        ? { ...prev, subOrder: { ...prev.subOrder, ...updatedSub } }
        : prev
    );
    router.refresh();
  };

  const handleCompleteSubOrder = async (sub: EnrichedSubOrder) => {
    setCompletingSubId(sub.id);
    try {
      const res = await fetch("/api/orders/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: sub.id,
          action: "COMPLETE_ORDER",
        }),
      });
      const data = await res.json();
      if (data.success && data.subOrder) {
        syncSubOrderInState(data.subOrder);
        setBannerFeedback(
          `Pesanan ${sub.id} (${sub.store?.name}) telah dikonfirmasi selesai (COMPLETED). Dana Escrow sebesar ${formatIDR(
            sub.subTotal
          )} dicairkan ke saldo toko.`
        );
        setTimeout(() => setBannerFeedback(null), 6000);
      }
    } finally {
      setCompletingSubId(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 border border-neutral-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#185B37] mb-1">
            <PackageCheck className="w-3.5 h-3.5" />
            MASTER ORDER &amp; LIVE SUBORDER SHIPMENT TRACKING
          </span>
          <h1 className="font-serif text-3xl text-[#0A0A0A]">
            Riwayat Transaksi Pembeli (Budi — Buyer)
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Menampilkan setiap{" "}
            <strong className="text-[#0A0A0A]">Master Order</strong> beserta
            pecahan <strong className="text-[#0A0A0A]">SubOrder</strong> per
            toko, lengkap dengan fitur{" "}
            <strong className="text-[#185B37]">Lihat Detail Pesanan</strong> dan{" "}
            <strong className="text-[#185B37]">
              Lacak Pengiriman Real-Time
            </strong>
            .
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-bold uppercase tracking-[0.14em] self-start sm:self-auto transition-colors"
        >
          + Belanja Lagi
        </Link>
      </div>

      {bannerFeedback && (
        <div
          className="p-4 bg-[#0A0A0A] text-white border border-[#185B37] text-xs font-medium flex items-center gap-2.5"
          data-testid="buyer-order-feedback"
        >
          <Check className="w-4 h-4 text-[#4ADE80] flex-shrink-0" />
          <span>{bannerFeedback}</span>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            data-testid={`master-order-card-${order.id}`}
            className="bg-white border border-neutral-200 overflow-hidden"
          >
            {/* Master Order Header */}
            <div className="bg-[#0A0A0A] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-white text-xs uppercase tracking-wider">
                  MASTER ORDER: {order.id}
                </span>
                <span className="text-xs text-neutral-600">|</span>
                <span className="text-xs font-mono text-neutral-400">
                  {new Date(order.createdAt).toLocaleString("id-ID")}
                </span>
                <span className="px-2 py-0.5 bg-[#185B37] text-white text-[10px] font-mono font-semibold uppercase tracking-widest">
                  PAYMENT: {order.paymentStatus}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono text-neutral-300 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-[#4ADE80]" />
                  {order.subOrders.length} SUBORDER
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  TOTAL: {formatIDR(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Child SubOrders Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#FAFAFA]">
              {order.subOrders.map((sub) => {
                const isTrackablePrimary =
                  sub.orderStatus === "PACKING" ||
                  sub.orderStatus === "SHIPPED" ||
                  sub.orderStatus === "COMPLETED";
                const latestLog = sub.trackingLogs?.[0];
                const isCompleting = completingSubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    data-testid={`buyer-suborder-card-${sub.id}`}
                    className="bg-white border border-neutral-200 p-5 flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-3">
                      {/* Store Name & Status Badge */}
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#0A0A0A]" />
                          <span className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider">
                            {sub.store?.name}
                          </span>
                          {sub.store?.isOfficialStore && (
                            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[#185B37]/10 text-[#185B37] border border-[#185B37]/30">
                              OFFICIAL
                            </span>
                          )}
                        </div>
                        <span
                          data-testid={`buyer-suborder-status-${sub.id}`}
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 uppercase tracking-widest border ${
                            sub.orderStatus === "COMPLETED" ||
                            sub.orderStatus === "SHIPPED"
                              ? "bg-[#185B37]/10 text-[#185B37] border-[#185B37]/30"
                              : sub.orderStatus === "PACKING"
                              ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                              : sub.orderStatus === "CANCELLED"
                              ? "bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/30"
                              : "bg-neutral-100 text-[#0A0A0A] border-neutral-300"
                          }`}
                        >
                          {sub.orderStatus}
                        </span>
                      </div>

                      {/* SubOrder ID, Courier & AWB Resi */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
                        <span>
                          SUBORDER:{" "}
                          <code className="font-bold text-[#0A0A0A]">
                            {sub.id}
                          </code>
                        </span>
                        <span className="flex items-center gap-1 text-[#0A0A0A]">
                          <Truck className="w-3.5 h-3.5 text-[#185B37]" />
                          <span>{sub.shippingCourier}</span>
                        </span>
                      </div>

                      {sub.trackingNumber && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#FAFAFA] border border-neutral-200 text-[11px] font-mono">
                          <span className="text-neutral-500 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-[#185B37]" />
                            No. Resi (AWB):
                          </span>
                          <span className="font-bold text-[#0A0A0A]">
                            {sub.trackingNumber}
                          </span>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="divide-y divide-neutral-200 pt-1">
                        {sub.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {item.variant?.product?.images?.[0] ? (
                                <img
                                  src={item.variant.product.images[0]}
                                  alt={item.variant.product.name}
                                  className="w-10 h-12 object-cover border border-neutral-200 bg-neutral-100"
                                />
                              ) : (
                                <div className="w-10 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                  <ShoppingBag className="w-4 h-4 text-neutral-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-[#0A0A0A] line-clamp-1">
                                  {item.variant?.product?.name ||
                                    "Produk Fashion"}
                                </div>
                                <div className="text-[11px] font-mono text-neutral-500">
                                  SIZE {item.variant?.size} •{" "}
                                  {item.variant?.color} × {item.quantity}
                                </div>
                              </div>
                            </div>
                            <div className="font-mono font-bold text-[#0A0A0A]">
                              {formatIDR(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Latest Tracking Checkpoint Preview */}
                      {latestLog && (
                        <div className="px-3 py-2 bg-[#185B37]/[0.05] border border-[#185B37]/25 flex items-start gap-2 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-[#185B37] mt-1 flex-shrink-0 animate-pulse" />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[10px] text-[#185B37] font-bold uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {latestLog.hubName} • {latestLog.timestamp}
                              </span>
                            </div>
                            <div className="text-[#0A0A0A] font-medium line-clamp-1 mt-0.5">
                              {latestLog.title}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Subtotal + Action Buttons Footer */}
                    <div className="pt-3 border-t border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">
                          Subtotal + Ongkir ({formatIDR(sub.shippingCost)})
                        </span>
                        <span className="font-mono font-bold text-[#0A0A0A] text-sm">
                          {formatIDR(sub.subTotal + sub.shippingCost)}
                        </span>
                      </div>

                      {/* Action Footer Row */}
                      <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-end gap-2">
                        {/* 1. Lihat Detail Pesanan (Outline Button) */}
                        <button
                          type="button"
                          data-testid={`btn-detail-pesanan-${sub.id}`}
                          onClick={() =>
                            setDetailModalContext({
                              subOrder: sub,
                              masterOrderId: order.id,
                              masterTotalAmount: order.totalAmount,
                              paymentStatus: order.paymentStatus,
                              createdAt: order.createdAt,
                            })
                          }
                          className="px-3 py-2 border border-neutral-300 bg-white hover:border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Lihat Detail Pesanan</span>
                        </button>

                        {/* 2. Lacak Pengiriman (Highlighted when PACKING, SHIPPED, COMPLETED) */}
                        <button
                          type="button"
                          data-testid={`btn-lacak-pengiriman-${sub.id}`}
                          onClick={() => setTrackingModalSub(sub)}
                          className={`px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5 transition-colors ${
                            isTrackablePrimary
                              ? "bg-[#185B37] hover:bg-[#0A0A0A] text-white border border-[#185B37]"
                              : "bg-neutral-100 hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white border border-neutral-300"
                          }`}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Lacak Pengiriman</span>
                        </button>

                        {/* 3. Pesanan Diterima (Exclusively when SHIPPED) */}
                        {sub.orderStatus === "SHIPPED" && (
                          <button
                            type="button"
                            disabled={isCompleting}
                            data-testid={`btn-pesanan-diterima-${sub.id}`}
                            onClick={() => handleCompleteSubOrder(sub)}
                            className="px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5 transition-colors"
                          >
                            {isCompleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PackageCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                            )}
                            <span>Pesanan Diterima</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal 1: Live Shipment Tracking Timeline */}
      {trackingModalSub && (
        <ShipmentTrackingModal
          subOrder={trackingModalSub}
          onClose={() => setTrackingModalSub(null)}
          onSubOrderUpdated={syncSubOrderInState}
        />
      )}

      {/* Modal 2: Order Detail & Invoice */}
      {detailModalContext && (
        <OrderDetailInvoiceModal
          subOrder={detailModalContext.subOrder}
          masterOrderId={detailModalContext.masterOrderId}
          masterTotalAmount={detailModalContext.masterTotalAmount}
          paymentStatus={detailModalContext.paymentStatus}
          createdAt={detailModalContext.createdAt}
          onClose={() => setDetailModalContext(null)}
          onOpenTracking={() => {
            const targetSub = detailModalContext.subOrder;
            setDetailModalContext(null);
            setTrackingModalSub(targetSub);
          }}
        />
      )}
    </div>
  );
}

