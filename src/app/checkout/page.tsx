"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Truck,
  CheckCircle2,
  GitFork,
  ShieldCheck,
  Store,
  ArrowRight,
  CreditCard,
  Loader2,
  PackageCheck,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatIDR } from "@/lib/utils";
import type { EnrichedOrder } from "@/lib/prisma";

const COURIER_OPTIONS = [
  {
    id: "JNE Reguler (2-3 Hari)",
    label: "JNE Reguler (2-3 Hari)",
    cost: 22000,
  },
  {
    id: "SiCepat BEST Next Day",
    label: "SiCepat BEST Next Day (1 Hari)",
    cost: 28000,
  },
  {
    id: "J&T Express EZ",
    label: "J&T Express EZ (2 Hari)",
    cost: 19000,
  },
  {
    id: "GoSend Same Day",
    label: "GoSend Same Day (6-8 Jam)",
    cost: 35000,
  },
];

export default function CheckoutPage() {
  const { selectedGroups, selectedSubTotal, clearSelectedItems } = useCart();

  const [couriersByStore, setCouriersByStore] = useState<
    Record<string, { label: string; cost: number }>
  >({});
  const [paymentMethod, setPaymentMethod] = useState(
    "BCA Virtual Account (Auto-Paid)"
  );
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<EnrichedOrder | null>(
    null
  );

  const getStoreCourier = (storeId: string) => {
    return couriersByStore[storeId] || COURIER_OPTIONS[0];
  };

  const totalShippingCost = selectedGroups.reduce(
    (sum, g) => sum + getStoreCourier(g.storeId).cost,
    0
  );
  const grandTotal = selectedSubTotal + totalShippingCost;

  const handlePlaceSplitOrder = async () => {
    if (selectedGroups.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        groups: selectedGroups.map((group) => {
          const courier = getStoreCourier(group.storeId);
          return {
            storeId: group.storeId,
            shippingCourier: courier.label,
            shippingCost: courier.cost,
            items: group.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          };
        }),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCompletedOrder(data.order);
        clearSelectedItems();
      }
    } catch (err) {
      console.error("Failed checkout:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Post-Checkout Split Order Proof View
  if (completedOrder) {
    return (
      <div
        id="checkout-success-proof"
        className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-6"
      >
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#185B37] text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#185B37]">
                  MULTI-TENANT SPLIT ORDER CONFIRMED
                </span>
                <h1 className="font-serif text-3xl text-[#0A0A0A] mt-0.5">
                  1 Master Order Dipecah Menjadi{" "}
                  {completedOrder.subOrders.length} SubOrder!
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Setiap toko (Tenant) kini menerima pecahan{" "}
                  <code className="font-mono font-semibold text-[#0A0A0A]">SubOrder</code> masing-masing
                  secara terisolasi berdasarkan{" "}
                  <code className="font-mono font-semibold text-[#0A0A0A]">storeId</code>.
                </p>
              </div>
            </div>

            <div className="bg-[#0A0A0A] text-white p-4 text-right">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                ID MASTER ORDER (BUYER)
              </div>
              <div className="font-mono font-bold text-white text-base mt-0.5">
                {completedOrder.id}
              </div>
              <div className="text-xs font-mono mt-1 text-neutral-300">
                Total: {formatIDR(completedOrder.totalAmount)} •{" "}
                <span className="text-[#4ADE80] font-semibold">
                  {completedOrder.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Generated SubOrders Proof Grid */}
          <div className="space-y-3">
            <h2 className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-neutral-500 flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5 text-[#185B37]" />
              Pecahan SubOrder per Tenant di Database MySQL:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedOrder.subOrders.map((sub, idx) => (
                <div
                  key={sub.id}
                  data-testid={`generated-suborder-${sub.storeId}`}
                  className="p-5 bg-[#FAFAFA] border border-neutral-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#0A0A0A] text-white">
                      SubOrder #{idx + 1}: {sub.id}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 bg-[#185B37]/10 text-[#185B37] border border-[#185B37]/30 uppercase tracking-widest">
                      STATUS: {sub.orderStatus}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-[#0A0A0A] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#0A0A0A]" />
                      {sub.store.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Tenant Isolation Key:{" "}
                      <code className="font-mono font-semibold text-[#0A0A0A]">
                        storeId=&quot;{sub.storeId}&quot;
                      </code>{" "}
                      • Kurir: {sub.shippingCourier}
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-200 bg-white p-3 border border-neutral-200 text-xs">
                    {sub.items.map((it) => (
                      <div
                        key={it.id}
                        className="py-1.5 flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-[#0A0A0A] truncate">
                          {it.quantity}x {it.variant?.product?.name || "Produk"}{" "}
                          ({it.variant?.size} / {it.variant?.color})
                        </span>
                        <span className="font-mono font-semibold text-[#0A0A0A]">
                          {formatIDR(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-500">
                      Subtotal + Ongkir ({formatIDR(sub.shippingCost)})
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0A0A0A]">
                      {formatIDR(sub.subTotal + sub.shippingCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200">
            <p className="text-xs text-neutral-500">
              Uji Isolasi Tenant: Gunakan <strong>Demo Role Switcher</strong> di kanan atas lalu pilih{" "}
              <strong>Admin Toko A</strong> atau <strong>Admin Toko B</strong>{" "}
              untuk memverifikasi isolasi <code className="font-mono">SubOrder</code>.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/orders"
                className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-1.5 transition-colors"
              >
                <PackageCheck className="w-4 h-4" />
                Lihat Riwayat Pesanan Buyer
              </Link>
              <Link
                href="/"
                className="px-4 py-2.5 border border-neutral-300 text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.14em]"
              >
                Kembali Belanja
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="bg-white p-6 border border-neutral-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#185B37] mb-1">
            <GitFork className="w-3.5 h-3.5" />
            MULTI-TENANT ORDER SPLITTING ENGINE
          </span>
          <h1 className="font-serif text-3xl text-[#0A0A0A]">
            Checkout &amp; Pengiriman Lintas Toko
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Pilih kurir untuk masing-masing toko. Sistem akan memecah 1{" "}
            <code className="font-mono font-semibold text-[#0A0A0A]">Order</code> utama menjadi{" "}
            <strong className="text-[#0A0A0A]">{selectedGroups.length} SubOrder</strong> otomatis.
          </p>
        </div>
      </div>

      {selectedGroups.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center space-y-4">
          <h2 className="font-serif text-2xl text-[#0A0A0A]">
            Belum ada item yang dipilih untuk Checkout
          </h2>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0A0A0A] text-white text-[11px] font-bold uppercase tracking-[0.14em]"
          >
            Kembali ke Keranjang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Address & Store Shipment Cards */}
          <div className="lg:col-span-8 space-y-5">
            {/* Buyer Shipping Address */}
            <div className="bg-white p-5 border border-neutral-200 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#185B37]">
                <MapPin className="w-3.5 h-3.5" />
                ALAMAT PENGIRIMAN PEMBELI
              </div>
              <div className="font-bold text-[#0A0A0A] text-sm">
                Budi - Buyer (0812-8899-7766)
              </div>
              <p className="text-xs text-neutral-600">
                Jl. Senopati Raya No. 88, Kebayoran Baru, Jakarta Selatan, DKI
                Jakarta 12190
              </p>
            </div>

            {/* Per-Store Shipment & SubOrder Card */}
            {selectedGroups.map((group, index) => {
              const selectedCourier = getStoreCourier(group.storeId);

              return (
                <div
                  key={group.storeId}
                  className="bg-white border border-neutral-200 overflow-hidden"
                >
                  <div className="bg-[#0A0A0A] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-[#185B37] text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                        SubOrder #{index + 1}
                      </span>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {group.storeName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-300">
                      ORIGIN: <strong className="text-white">{group.storeCity}</strong> (
                      <code className="text-neutral-400">{group.storeId}</code>)
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Items list */}
                    <div className="divide-y divide-neutral-200">
                      {group.items.map((item) => (
                        <div
                          key={item.variantId}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-16 object-cover border border-neutral-200 bg-neutral-100"
                            />
                            <div>
                              <h3 className="text-xs font-semibold text-[#0A0A0A]">
                                {item.productName}
                              </h3>
                              <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                                {item.color} • SIZE {item.size} • {item.quantity} PCS
                              </p>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-[#0A0A0A]">
                            {formatIDR(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Courier Selector for this specific Store */}
                    <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] p-3.5 border">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0A0A0A]">
                        <Truck className="w-4 h-4 text-[#185B37]" />
                        Pilih Kurir Pengiriman ({group.storeCity}):
                      </div>
                      <select
                        value={selectedCourier.label}
                        onChange={(e) => {
                          const found =
                            COURIER_OPTIONS.find(
                              (c) => c.label === e.target.value
                            ) || COURIER_OPTIONS[0];
                          setCouriersByStore((prev) => ({
                            ...prev,
                            [group.storeId]: {
                              label: found.label,
                              cost: found.cost,
                            },
                          }));
                        }}
                        className="px-3 py-2 border border-neutral-300 bg-white text-xs font-mono font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                      >
                        {COURIER_OPTIONS.map((c) => (
                          <option key={c.id} value={c.label}>
                            {c.label} — {formatIDR(c.cost)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SubOrder Total */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-neutral-500">
                        Total Tagihan SubOrder #{index + 1} (Barang + Ongkir)
                      </span>
                      <span className="font-mono text-sm font-bold text-[#0A0A0A]">
                        {formatIDR(group.subTotal + selectedCourier.cost)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Payment & Split Execution */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white border border-neutral-200 p-6 space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  PAYMENT &amp; SETTLEMENT
                </div>
                <h2 className="font-serif text-2xl text-[#0A0A0A] mt-0.5">
                  Metode Pembayaran
                </h2>
              </div>

              <div className="space-y-2">
                {[
                  "BCA Virtual Account (Auto-Paid)",
                  "Mandiri Virtual Account (Auto-Paid)",
                  "QRIS / GoPay Instant (Auto-Paid)",
                ].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2.5 p-3 border text-xs font-semibold cursor-pointer transition-all ${
                      paymentMethod === method
                        ? "bg-[#FAFAFA] border-[#0A0A0A] text-[#0A0A0A]"
                        : "bg-white border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-[#0A0A0A]"
                    />
                    <CreditCard className="w-4 h-4 text-[#0A0A0A]" />
                    <span>{method}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2 text-xs border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Produk ({selectedGroups.length} Toko)</span>
                  <strong className="font-mono text-[#0A0A0A]">
                    {formatIDR(selectedSubTotal)}
                  </strong>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>
                    Total Ongkos Kirim ({selectedGroups.length} Kurir)
                  </span>
                  <strong className="font-mono text-[#0A0A0A]">
                    {formatIDR(totalShippingCost)}
                  </strong>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-neutral-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                    Total Bayar (Master Order)
                  </span>
                  <span className="font-mono text-xl font-bold text-[#0A0A0A]">
                    {formatIDR(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="submit-split-checkout-btn"
                disabled={submitting}
                onClick={handlePlaceSplitOrder}
                className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#185B37] text-white font-bold text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memecah Order ke {selectedGroups.length} Tenant...
                  </>
                ) : (
                  <>
                    Bayar &amp; Pecah {selectedGroups.length} SubOrder
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#185B37] flex-shrink-0" />
                <span>
                  Transaksi ACID MySQL: 1 baris <code className="font-mono">Order</code>{" "}
                  + {selectedGroups.length} baris{" "}
                  <code className="font-mono">SubOrder</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
