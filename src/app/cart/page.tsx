"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  GitBranch,
  RotateCcw,
  Store,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatIDR } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const {
    groupedByStore,
    selectedGroups,
    selectedItemsCount,
    selectedSubTotal,
    updateQuantity,
    removeItem,
    toggleSelectItem,
    toggleSelectStore,
    loadDemoMultiTenantCart,
  } = useCart();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 border border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#185B37] font-semibold mb-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            MULTI-TENANT CART GROUPING BY STORE_ID
          </div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#0A0A0A]">
            Shopping Bag &amp; Tenant Allocation
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Item secara otomatis dikelompokkan berdasarkan{" "}
            <code className="font-mono font-semibold text-[#0A0A0A]">storeId</code>{" "}
            dan akan dipecah menjadi beberapa{" "}
            <code className="font-mono font-semibold text-[#0A0A0A]">SubOrder</code>{" "}
            saat Checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDemoMultiTenantCart}
          className="px-4 py-2.5 border border-neutral-300 hover:border-[#0A0A0A] bg-white text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.14em] flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Contoh Keranjang 2 Toko
        </button>
      </div>

      {groupedByStore.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center space-y-4">
          <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto" />
          <h2 className="font-serif text-2xl text-[#0A0A0A]">
            Keranjang Belanja Anda Kosong
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Tambahkan produk dari Streetwear Distro Bandung dan Batik &amp; Linen
            Modern Jakarta untuk mencoba fitur Multi-Tenant Split Checkout.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadDemoMultiTenantCart}
              className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-bold uppercase tracking-[0.14em] transition-colors"
            >
              Isi Otomatis Produk 2 Toko (Demo)
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-neutral-300 hover:border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors"
            >
              Jelajahi Katalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Store Groups */}
          <div className="lg:col-span-8 space-y-5">
            {groupedByStore.map((group, index) => {
              const allStoreSelected = group.items.every((i) => i.selected);

              return (
                <div
                  key={group.storeId}
                  data-testid={`cart-store-group-${group.storeId}`}
                  className="bg-white border border-neutral-200 overflow-hidden"
                >
                  {/* Store Header */}
                  <div className="bg-[#FAFAFA] px-5 py-3.5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allStoreSelected}
                        onChange={(e) =>
                          toggleSelectStore(group.storeId, e.target.checked)
                        }
                        className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                      />
                      <div className="flex items-center gap-2.5">
                        <Store className="w-4 h-4 text-[#0A0A0A]" />
                        <span className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider">
                          {group.storeName}
                        </span>
                        {group.isOfficialStore ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#185B37]/10 text-[#185B37] border border-[#185B37]/30 text-[9px] font-mono font-semibold uppercase tracking-widest">
                            OFFICIAL STORE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 text-[9px] font-mono font-semibold uppercase tracking-widest">
                            STAR SELLER
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 font-mono uppercase">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {group.storeCity}
                      </span>
                      <span className="font-mono text-[10px] bg-white border border-neutral-200 text-[#0A0A0A] px-2 py-0.5">
                        SubOrder #{index + 1} ({group.storeId})
                      </span>
                    </div>
                  </div>

                  {/* Items inside this Store Group */}
                  <div className="divide-y divide-neutral-200">
                    {group.items.map((item) => (
                      <div
                        key={item.variantId}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelectItem(item.variantId)}
                            className="w-4 h-4 mt-2 accent-[#0A0A0A] cursor-pointer"
                          />
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-20 object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                          />
                          <div className="space-y-1.5">
                            <Link
                              href={`/product/${item.productSlug}`}
                              className="font-medium text-[#0A0A0A] hover:underline text-sm line-clamp-2"
                            >
                              {item.productName}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-600">
                              <span className="bg-[#FAFAFA] border border-neutral-200 px-2 py-0.5">
                                COLOR: {item.color}
                              </span>
                              <span className="bg-[#FAFAFA] border border-neutral-200 px-2 py-0.5">
                                SIZE: {item.size}
                              </span>
                            </div>
                            <div className="pt-1 flex items-baseline gap-2 font-mono">
                              <span className="text-sm font-bold text-[#0A0A0A]">
                                {formatIDR(item.price)}
                              </span>
                              {item.basePrice > item.price && (
                                <span className="text-[11px] text-neutral-400 line-through">
                                  {formatIDR(item.basePrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity & Delete Controls */}
                        <div className="flex items-center justify-end gap-3 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className="p-2 border border-transparent hover:border-neutral-200 text-neutral-400 hover:text-[#9E2A2B] transition-colors"
                            title="Hapus varian"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center border border-neutral-300 bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              className="p-2 hover:bg-neutral-100 text-[#0A0A0A]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3.5 text-xs font-mono font-bold text-[#0A0A0A]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              className="p-2 hover:bg-neutral-100 text-[#0A0A0A]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Store Group Subtotal Footer */}
                  <div className="bg-[#FAFAFA] px-5 py-3 border-t border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-600">
                      Subtotal Tenant <strong className="text-[#0A0A0A]">{group.storeName}</strong>
                    </span>
                    <span className="font-mono font-bold text-[#0A0A0A] text-sm">
                      {formatIDR(group.subTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Multi-Tenant Split Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white border border-neutral-200 p-6 space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  ORDER SUMMARY
                </div>
                <h2 className="font-serif text-2xl text-[#0A0A0A] mt-0.5">
                  Ringkasan &amp; Split Order
                </h2>
              </div>

              {/* Architecture Preview */}
              <div className="p-4 bg-[#0A0A0A] text-white space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  <span>SPLIT ORDER ENGINE</span>
                  <span className="bg-[#185B37] text-white px-2 py-0.5 text-[10px]">
                    1 ORDER → {selectedGroups.length} SUBORDER
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Saat Checkout, sistem otomatis membuat <strong className="text-white">1 Order</strong>{" "}
                  utama untuk Buyer dan memecahnya menjadi{" "}
                  <strong className="text-white">{selectedGroups.length} SubOrder</strong> terpisah
                  untuk masing-masing toko:
                </p>
                <div className="space-y-1.5 pt-1">
                  {selectedGroups.map((g, i) => (
                    <div
                      key={g.storeId}
                      className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="truncate text-neutral-200">
                        SubOrder #{i + 1}: {g.storeName}
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {formatIDR(g.subTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 text-xs border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Barang Dipilih</span>
                  <strong className="font-mono text-[#0A0A0A]">
                    {selectedItemsCount} PCS ({selectedGroups.length} TOKO)
                  </strong>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-neutral-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                    Total Harga Barang
                  </span>
                  <span className="font-mono text-xl font-bold text-[#0A0A0A]">
                    {formatIDR(selectedSubTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="proceed-to-checkout-btn"
                disabled={selectedGroups.length === 0}
                onClick={() => router.push("/checkout")}
                className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#185B37] disabled:bg-neutral-300 text-white font-bold text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
              >
                Lanjut ke Checkout ({selectedItemsCount})
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
