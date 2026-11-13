"use client";

import React, { useState } from "react";
import {
  X,
  Truck,
  Copy,
  Check,
  MapPin,
  Package,
  PackageCheck,
  Clock,
  ShieldCheck,
  Store,
  FileText,
  Navigation,
  Sparkles,
  Loader2,
  ArrowRight,
  User,
  Phone,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import type { EnrichedSubOrder } from "@/lib/prisma";
import {
  DEFAULT_BUYER_ADDRESS,
  buildTrackingLogsForStage,
  getDefaultTrackingStage,
} from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

const STEPPER_STAGES = [
  {
    key: "ORDERED",
    label: "Pesanan Dibuat",
    sublabel: "Pembayaran Terverifikasi",
    minStage: 0,
  },
  {
    key: "PACKING",
    label: "Dikemas Penjual",
    sublabel: "QC & Manifest Gudang",
    minStage: 1,
  },
  {
    key: "SHIPPED",
    label: "Dalam Pengiriman",
    sublabel: "Transit Hub & Kurir",
    minStage: 2,
  },
  {
    key: "DELIVERED",
    label: "Pesanan Tiba",
    sublabel: "Diterima Pembeli",
    minStage: 5,
  },
];

export function ShipmentTrackingModal({
  subOrder,
  onClose,
  onSubOrderUpdated,
}: {
  subOrder: EnrichedSubOrder;
  onClose: () => void;
  onSubOrderUpdated?: (updated: EnrichedSubOrder) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const originCity = subOrder.store?.city || "Bandung";
  const shippingAddress =
    subOrder.order?.shippingAddress || DEFAULT_BUYER_ADDRESS;
  const destCity = shippingAddress.city || "Jakarta Selatan";

  const currentStage =
    typeof subOrder.trackingStage === "number"
      ? subOrder.trackingStage
      : getDefaultTrackingStage(subOrder.orderStatus);

  const builtFallback = buildTrackingLogsForStage({
    subOrderId: subOrder.id,
    orderStatus: subOrder.orderStatus,
    shippingCourier: subOrder.shippingCourier,
    trackingNumber: subOrder.trackingNumber,
    originCity,
    destCity,
    trackingStage: currentStage,
  });

  const trackingNumber =
    subOrder.trackingNumber || builtFallback.trackingNumber || "JNE8829104482ID";
  const trackingLogs =
    Array.isArray(subOrder.trackingLogs) && subOrder.trackingLogs.length > 0
      ? subOrder.trackingLogs
      : builtFallback.trackingLogs;

  const handleCopyResi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(trackingNumber);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateCheckpoint = async (
    action: "ADVANCE_CHECKPOINT" | "SET_STAGE",
    targetStage?: number
  ) => {
    setSimulating(true);
    try {
      const res = await fetch("/api/orders/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: subOrder.id,
          action,
          targetStage,
        }),
      });
      const data = await res.json();
      if (data.success && data.subOrder) {
        onSubOrderUpdated?.(data.subOrder);
        const latestLog = data.subOrder.trackingLogs?.[0];
        if (latestLog) {
          setSimFeedback(`Checkpoint diperbarui: ${latestLog.hubName}`);
          setTimeout(() => setSimFeedback(null), 3500);
        }
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleCompleteOrder = async () => {
    setCompleting(true);
    try {
      const res = await fetch("/api/orders/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: subOrder.id,
          action: "COMPLETE_ORDER",
        }),
      });
      const data = await res.json();
      if (data.success && data.subOrder) {
        onSubOrderUpdated?.(data.subOrder);
        setSimFeedback(
          "Pesanan selesai (COMPLETED)! Dana Escrow telah dicairkan ke saldo toko."
        );
      }
    } finally {
      setCompleting(false);
    }
  };

  const getNextCheckpointLabel = (stage: number) => {
    switch (stage) {
      case 0:
        return "Majukan ke: Dikemas di Gudang " + originCity;
      case 1:
        return `Majukan ke: Berangkat dari ${originCity} Hub`;
      case 2:
        return "Majukan ke: Tiba di Jakarta Gateway Hub";
      case 3:
        return "Majukan ke: Sedang Diantar Kurir (Ahmad S.)";
      case 4:
        return "Majukan ke: Paket Tiba & Diterima (Terkirim)";
      case 5:
      default:
        return `Ulangi Simulasi dari ${originCity} Hub`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-end sm:justify-center p-0 sm:p-4 overflow-y-auto"
      data-testid="shipment-tracking-modal"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-900 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Editorial Modal Bar */}
        <div className="bg-[#0A0A0A] text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4ADE80]">
              <Truck className="w-3.5 h-3.5" />
              LIVE SHIPMENT TELEMETRY • SUBORDER {subOrder.id}
            </div>
            <h2 className="font-serif text-2xl font-semibold text-white mt-0.5">
              Lacak Pengiriman Paket
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-tracking-modal"
            className="p-2 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
            aria-label="Tutup modal pelacakan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* 1. Header Info Kurir & AWB */}
          <div className="bg-[#FAFAFA] border border-neutral-200 p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 block">
                EKSPEDISI PENGIRIMAN
              </span>
              <div className="text-xs sm:text-sm font-bold text-[#0A0A0A] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#185B37] flex-shrink-0" />
                <span>{subOrder.shippingCourier}</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Toko:{" "}
                <strong className="text-[#0A0A0A]">
                  {subOrder.store?.name}
                </strong>
              </div>
            </div>

            <div className="md:col-span-5 space-y-0.5 md:border-l md:border-r border-neutral-200 md:px-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 block">
                NOMOR RESI (AWB)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <code
                  className="font-mono text-xs sm:text-sm font-bold text-[#0A0A0A] bg-white px-2 py-0.5 border border-neutral-300"
                  data-testid="tracking-awb-number"
                >
                  {trackingNumber}
                </code>
                <button
                  type="button"
                  onClick={handleCopyResi}
                  data-testid="btn-copy-resi"
                  className="px-2.5 py-1 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 whitespace-nowrap transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#4ADE80]" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Resi
                    </>
                  )}
                </button>
              </div>
              <div className="text-[11px] font-mono text-[#185B37] font-semibold">
                {subOrder.orderStatus === "COMPLETED"
                  ? "Status: Paket Telah Tiba (Terkirim)"
                  : "Estimasi Tiba: 04 – 05 Nov 2026"}
              </div>
            </div>

            <div className="md:col-span-3 space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500 block">
                RUTE LOGISTIK
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A]">
                <span className="px-2 py-0.5 bg-white border border-neutral-300 font-mono">
                  {originCity}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#185B37] flex-shrink-0" />
                <span className="px-2 py-0.5 bg-[#185B37]/10 border border-[#185B37]/30 text-[#185B37] font-mono">
                  {destCity}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                Penerima: <strong className="text-[#0A0A0A]">{shippingAddress.recipientName}</strong>
              </div>
            </div>
          </div>

          {/* 2. Visual Progress Stepper (4 Tahap Utama) */}
          <div className="border border-neutral-200 p-3.5 bg-white">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-neutral-500">
                TAHAPAN PENGIRIMAN PAKET (4 TAHAP UTAMA)
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#185B37]/10 text-[#185B37] border border-[#185B37]/30">
                STATUS: {subOrder.orderStatus} (STAGE {currentStage}/5)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STEPPER_STAGES.map((step, index) => {
                const isReached = currentStage >= step.minStage;
                const isCurrentStep =
                  (index === 0 && currentStage === 0) ||
                  (index === 1 && currentStage === 1) ||
                  (index === 2 && currentStage >= 2 && currentStage <= 4) ||
                  (index === 3 && currentStage >= 5);

                return (
                  <div
                    key={step.key}
                    className={`p-2.5 border transition-colors relative ${
                      isCurrentStep
                        ? "border-[#185B37] bg-[#185B37]/[0.05]"
                        : isReached
                        ? "border-neutral-900 bg-[#FAFAFA]"
                        : "border-neutral-200 bg-white opacity-55"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-5 h-5 text-[10px] font-mono font-bold flex items-center justify-center ${
                          isCurrentStep
                            ? "bg-[#185B37] text-white"
                            : isReached
                            ? "bg-[#0A0A0A] text-white"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {isReached && !isCurrentStep ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      {isCurrentStep && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#185B37]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#185B37] animate-ping" />
                          AKTIF
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#0A0A0A]">
                      {step.label}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {step.sublabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Demo Simulation Control Bar */}
          <div className="bg-[#0A0A0A] text-white p-3.5 border border-neutral-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#4ADE80] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  SIMULASI DEMO PERGERAKAN KURIR REAL-TIME
                </div>
                <p className="text-[11px] text-neutral-300">
                  Majukan titik lokasi:{" "}
                  <span className="font-mono text-white">
                    {originCity} Hub → Jakarta Hub → Sedang Diantar Kurir → Terkirim
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={simulating}
                data-testid="btn-simulate-checkpoint"
                onClick={() => handleSimulateCheckpoint("ADVANCE_CHECKPOINT")}
                className="px-3.5 py-2 bg-[#185B37] hover:bg-[#14492c] text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-colors border border-[#4ADE80]/30 self-start sm:self-auto"
              >
                {simulating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>Simulasikan Pergerakan Kurir (Majukan Checkpoint)</span>
              </button>
            </div>

            {/* Direct Checkpoint Jump Pills for Demo Convenience */}
            <div className="pt-1.5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <span className="text-neutral-400">
                {getNextCheckpointLabel(currentStage)} • Lompat ke checkpoint:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { stage: 1, label: `1. Gudang ${originCity}` },
                  { stage: 2, label: `2. ${originCity} Hub` },
                  { stage: 3, label: "3. Jakarta Hub" },
                  { stage: 4, label: "4. Diantar Kurir" },
                  { stage: 5, label: "5. Terkirim" },
                ].map((cp) => (
                  <button
                    key={cp.stage}
                    type="button"
                    disabled={simulating}
                    onClick={() =>
                      handleSimulateCheckpoint("SET_STAGE", cp.stage)
                    }
                    className={`px-2 py-0.5 border transition-colors ${
                      currentStage === cp.stage
                        ? "bg-[#185B37] text-white border-[#4ADE80] font-bold"
                        : "bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    {cp.label}
                  </button>
                ))}
              </div>
            </div>

            {simFeedback && (
              <div className="text-[11px] font-mono text-[#4ADE80] flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                <span>{simFeedback}</span>
              </div>
            )}
          </div>

          {/* 4. Vertical Tracking Log (Riwayat Perjalanan Paket Realistis) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#0A0A0A]">
                RIWAYAT PERJALANAN PAKET ({trackingLogs.length} CHECKPOINT LOGISTIK)
              </h3>
              <span className="text-[11px] font-mono text-neutral-500">
                Zona Waktu: WIB (UTC+7)
              </span>
            </div>

            <div
              className="border border-neutral-200 bg-[#FAFAFA] p-4"
              data-testid="vertical-tracking-timeline"
            >
              <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-300">
                {trackingLogs.map((log, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={log.id || idx}
                      data-testid={`tracking-log-item-${idx}`}
                      className={`relative p-3 border transition-all ${
                        isLatest
                          ? "bg-white border-[#185B37] shadow-sm"
                          : "bg-white/80 border-neutral-200"
                      }`}
                    >
                      {/* Timeline Node Dot */}
                      <span
                        className={`absolute -left-[23px] top-4 w-4 h-4 rounded-full flex items-center justify-center ${
                          isLatest
                            ? "bg-[#185B37] ring-4 ring-[#185B37]/20"
                            : "bg-neutral-400 border-2 border-white"
                        }`}
                      >
                        {isLatest && (
                          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
                        )}
                      </span>

                      <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`text-[11px] font-mono font-semibold flex items-center gap-1.5 ${
                            isLatest ? "text-[#185B37]" : "text-neutral-500"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                            isLatest
                              ? "bg-[#185B37] text-white border-[#185B37] font-bold"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200"
                          }`}
                        >
                          {log.hubName}
                        </span>
                      </div>

                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          isLatest ? "text-[#0A0A0A]" : "text-neutral-800"
                        }`}
                      >
                        {log.title}
                      </div>

                      <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                        {log.description}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
                        <MapPin className="w-3 h-3 text-[#185B37] flex-shrink-0" />
                        <span>{log.location}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAFAFA] border-t border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <ShieldCheck className="w-4 h-4 text-[#185B37]" />
            <span>
              Dilindungi{" "}
              <strong className="text-[#0A0A0A]">FashionHub Escrow</strong> •
              Total SubOrder:{" "}
              <strong className="font-mono text-[#0A0A0A]">
                {formatIDR(subOrder.subTotal + subOrder.shippingCost)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {subOrder.orderStatus === "SHIPPED" && (
              <button
                type="button"
                disabled={completing}
                data-testid="modal-btn-pesanan-diterima"
                onClick={handleCompleteOrder}
                className="px-4 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-1.5 transition-colors"
              >
                {completing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PackageCheck className="w-3.5 h-3.5" />
                )}
                Pesanan Diterima
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-neutral-300 bg-white hover:border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailInvoiceModal({
  subOrder,
  masterOrderId,
  masterTotalAmount,
  paymentStatus,
  createdAt,
  onClose,
  onOpenTracking,
}: {
  subOrder: EnrichedSubOrder;
  masterOrderId: string;
  masterTotalAmount: number;
  paymentStatus: string;
  createdAt: string;
  onClose: () => void;
  onOpenTracking: () => void;
}) {
  const shippingAddress =
    subOrder.order?.shippingAddress || DEFAULT_BUYER_ADDRESS;
  const originCity = subOrder.store?.city || "Bandung";

  // Calculate original base price vs paid price savings if any
  const totalBaseMerchandise = subOrder.items.reduce((acc, item) => {
    const base = item.variant?.product?.basePrice || item.price;
    return acc + base * item.quantity;
  }, 0);
  const productDiscountSavings = Math.max(
    0,
    totalBaseMerchandise - subOrder.subTotal
  );
  const grandTotalSubOrder = subOrder.subTotal + subOrder.shippingCost;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      data-testid="order-detail-modal"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-900 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0A0A0A] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4ADE80]">
              <Receipt className="w-3.5 h-3.5" />
              OFFICIAL TRANSACTION INVOICE • ESCROW LEDGER
            </div>
            <h2 className="font-serif text-2xl font-semibold text-white mt-0.5">
              Detail Pesanan Lengkap
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-detail-modal"
            className="p-2 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
            aria-label="Tutup detail pesanan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Master Order & SubOrder Metadata Grid */}
          <div className="bg-[#FAFAFA] border border-neutral-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                NO. MASTER ORDER
              </span>
              <span className="font-mono font-bold text-[#0A0A0A]">
                {masterOrderId}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                NO. SUBORDER TOKO
              </span>
              <span className="font-mono font-bold text-[#185B37]">
                {subOrder.id}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                TANGGAL PEMBELIAN
              </span>
              <span className="font-mono text-[#0A0A0A]">
                {new Date(createdAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                STATUS PEMBAYARAN
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 bg-[#185B37] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  {paymentStatus}
                </span>
                <span className="px-2 py-0.5 bg-white border border-neutral-300 text-[#0A0A0A] text-[10px] font-mono font-bold uppercase">
                  {subOrder.orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Alamat Pengiriman Pembeli & Info Kurir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#185B37]">
                <MapPin className="w-3.5 h-3.5" />
                ALAMAT PENGIRIMAN PEMBELI
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-[#0A0A0A] flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{shippingAddress.recipientName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600">
                    {shippingAddress.label}
                  </span>
                </div>
                <div className="font-mono text-neutral-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{shippingAddress.phone}</span>
                </div>
                <p className="text-neutral-600 leading-relaxed pt-1">
                  {shippingAddress.addressLine}, {shippingAddress.district},{" "}
                  {shippingAddress.city}, {shippingAddress.province}{" "}
                  {shippingAddress.postalCode}
                </p>
              </div>
            </div>

            <div className="border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#0A0A0A]">
                <Store className="w-3.5 h-3.5 text-[#185B37]" />
                INFORMASI TENANT &amp; LOGISTIK
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-[#0A0A0A] flex items-center gap-2">
                  <span>{subOrder.store?.name}</span>
                  {subOrder.store?.isOfficialStore && (
                    <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[#185B37]/10 text-[#185B37] border border-[#185B37]/30">
                      OFFICIAL STORE
                    </span>
                  )}
                </div>
                <div className="text-neutral-600">
                  Kota Asal Pengiriman:{" "}
                  <strong className="text-[#0A0A0A]">{originCity}</strong>
                </div>
                <div className="text-neutral-600 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#185B37]" />
                  <span>Kurir: </span>
                  <strong className="text-[#0A0A0A]">
                    {subOrder.shippingCourier}
                  </strong>
                </div>
                <div className="text-neutral-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#185B37]" />
                  <span>No. Resi (AWB): </span>
                  <code className="font-mono font-bold text-[#0A0A0A] bg-[#FAFAFA] px-1.5 py-0.5 border border-neutral-200">
                    {subOrder.trackingNumber || "Menunggu Pick-up Kurir"}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Daftar Produk yang Dibeli */}
          <div className="border border-neutral-200">
            <div className="bg-[#FAFAFA] px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-neutral-600">
              <span>DAFTAR PRODUK YANG DIBELI ({subOrder.items.length} ITEM)</span>
              <span>SUBTOTAL HARGA</span>
            </div>
            <div className="divide-y divide-neutral-200">
              {subOrder.items.map((item) => {
                const product = item.variant?.product;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      {product?.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-18 object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-18 bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-bold text-[#0A0A0A] text-xs sm:text-sm">
                          {product?.name || "Produk Fashion Lokal"}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-500">
                          <span className="px-1.5 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-[#0A0A0A]">
                            UKURAN: {item.variant?.size}
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-[#0A0A0A]">
                            WARNA: {item.variant?.color}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-600">
                          {item.quantity} barang × {formatIDR(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-[#0A0A0A] text-sm whitespace-nowrap">
                      {formatIDR(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Rincian Pembayaran */}
          <div className="border border-neutral-200 bg-[#FAFAFA] p-4 space-y-2.5 text-xs">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#0A0A0A] pb-1 border-b border-neutral-200">
              RINCIAN PEMBAYARAN (SUBORDER {subOrder.id})
            </div>

            {productDiscountSavings > 0 && (
              <>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Total Harga Normal ({subOrder.items.length} Barang)</span>
                  <span className="font-mono line-through text-neutral-400">
                    {formatIDR(totalBaseMerchandise)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#185B37] font-medium">
                  <span>Diskon Kampanye Local Pride</span>
                  <span className="font-mono">
                    -{formatIDR(productDiscountSavings)}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-neutral-600">
              <span>
                Total Harga Barang ({subOrder.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                Pcs)
              </span>
              <span className="font-mono font-semibold text-[#0A0A0A]">
                {formatIDR(subOrder.subTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span>Biaya Ongkos Kirim ({subOrder.shippingCourier})</span>
              <span className="font-mono font-semibold text-[#0A0A0A]">
                {formatIDR(subOrder.shippingCost)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span>Biaya Proteksi Escrow &amp; Asuransi Pengiriman</span>
              <span className="font-mono text-[#185B37] font-semibold">
                Rp 0 (Gratis)
              </span>
            </div>

            <div className="pt-2.5 border-t border-neutral-300 flex items-center justify-between text-sm font-bold text-[#0A0A0A]">
              <span>Total Belanja SubOrder</span>
              <span className="font-mono text-base text-[#185B37]">
                {formatIDR(grandTotalSubOrder)}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Total Master Order ({masterOrderId})</span>
              <span>{formatIDR(masterTotalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAFAFA] border-t border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenTracking}
            data-testid="detail-to-tracking-btn"
            className="px-4 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-2 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            Lacak Pengiriman
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-neutral-300 bg-white hover:border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
