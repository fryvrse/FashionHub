"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Ruler,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  X,
  Minus,
  Plus,
} from "lucide-react";
import type { EnrichedProduct } from "@/lib/prisma";
import { formatIDR, getDiscountPercent } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

export function ProductDetailClient({
  product,
}: {
  product: EnrichedProduct;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const uniqueColors = React.useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants]
  );
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44", "45"];
  const uniqueSizes = React.useMemo(
    () =>
      Array.from(new Set(product.variants.map((v) => v.size))).sort(
        (a, b) => {
          const ia = SIZE_ORDER.indexOf(a);
          const ib = SIZE_ORDER.indexOf(b);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.variants]
  );

  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [selectedColor, setSelectedColor] = useState<string>(
    uniqueColors[0] ?? ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    uniqueSizes[0] ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Re-initialize selection whenever the user navigates to a different product
  React.useEffect(() => {
    setActiveImage(product.images[0]);
    setSelectedColor(uniqueColors[0] ?? "");
    setSelectedSize(uniqueSizes[0] ?? "");
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Derived selected variant from (color, size) — always reactive to both selections
  const selectedVariant =
    product.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    ) ??
    product.variants.find((v) => v.color === selectedColor) ??
    product.variants[0];

  const discount = getDiscountPercent(
    product.basePrice,
    product.discountPrice
  );
  const finalPrice = product.discountPrice ?? product.basePrice;

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    // Keep current size if this color offers it; otherwise fall back to first size of that color
    const hasSize = product.variants.some(
      (v) => v.color === color && v.size === selectedSize
    );
    if (!hasSize) {
      const firstForColor = uniqueSizes.find((s) =>
        product.variants.some((v) => v.color === color && v.size === s)
      );
      if (firstForColor) setSelectedSize(firstForColor);
    }
    setQuantity(1);
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const handleAddToCart = (redirectToCart = false) => {
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0],
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: finalPrice,
      basePrice: product.basePrice,
      quantity,
      maxStock: selectedVariant.stock,
      storeId: product.store.id,
      storeName: product.store.name,
      storeCity: product.store.city,
      isOfficialStore: product.store.isOfficialStore,
    });

    if (redirectToCart) {
      router.push("/cart");
    } else {
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Portrait Editorial Gallery */}
      <div className="lg:col-span-5 space-y-3">
        <div className="aspect-[3/4] overflow-hidden bg-[#F3F3F1] border border-neutral-200 relative">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-[#9E2A2B] text-white font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-2.5 py-1">
              -{discount}% OFF
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {product.images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(img)}
              className={`w-16 h-20 overflow-hidden border transition-all ${
                activeImage === img
                  ? "border-[#0A0A0A] ring-1 ring-[#0A0A0A]"
                  : "border-neutral-200 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`${product.name} preview ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Middle Column: Editorial Product Specs, Variant Matrix, Store Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border-b border-neutral-200 pb-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            <span>{product.category}</span>
            <span className="font-mono">{product.store.id}</span>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#0A0A0A] leading-tight tracking-tight">
            {product.name}
          </h1>

          <div className="pt-2 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold text-[#0A0A0A]">
              {formatIDR(finalPrice)}
            </span>
            {discount > 0 && (
              <>
                <span className="font-mono text-xs text-neutral-400 line-through">
                  {formatIDR(product.basePrice)}
                </span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[#9E2A2B]/10 text-[#9E2A2B]">
                  HEMAT {discount}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Color Selector */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Warna:{" "}
            <span className="text-[#0A0A0A]" data-testid="selected-color-label">
              {selectedColor}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((color, cIdx) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  data-testid={`color-option-${cIdx}`}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectColor(color)}
                  className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
                    isSelected
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-white text-neutral-700 border-neutral-300 hover:border-[#0A0A0A]"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size Selector + Modal Size Chart Trigger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Ukuran:{" "}
              <span className="text-[#0A0A0A] font-mono" data-testid="selected-size-label">
                {selectedSize}
              </span>
            </label>
            <button
              type="button"
              id="open-size-chart-btn"
              onClick={() => setShowSizeChart(true)}
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#185B37] hover:text-[#0A0A0A] flex items-center gap-1 underline underline-offset-4"
            >
              <Ruler className="w-3 h-3" />
              Panduan Ukuran (Size Chart)
            </button>
          </div>
          <div
            className={`grid gap-2 ${
              uniqueSizes.length > 4 ? "grid-cols-6" : "grid-cols-4"
            }`}
          >
            {uniqueSizes.map((size) => {
              const isSelected = selectedSize === size;
              const variantForCombo = product.variants.find(
                (v) => v.size === size && v.color === selectedColor
              );
              const stockCount = variantForCombo?.stock ?? 0;
              const isUnavailable = !variantForCombo || stockCount <= 0;

              return (
                <button
                  key={size}
                  type="button"
                  data-testid={`size-option-${size}`}
                  aria-pressed={isSelected}
                  disabled={isUnavailable}
                  onClick={() => handleSelectSize(size)}
                  className={`py-2 px-2 text-center border transition-colors ${
                    isSelected
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : isUnavailable
                      ? "bg-neutral-50 text-neutral-300 border-neutral-200 cursor-not-allowed line-through"
                      : "bg-white text-[#0A0A0A] border-neutral-300 hover:border-[#0A0A0A]"
                  }`}
                >
                  <div className="font-mono text-xs font-semibold">{size}</div>
                  <div
                    className={`text-[9px] font-mono ${
                      isSelected ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    {stockCount} pcs
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Architectural Tenant Store Profile Card */}
        <div
          id="store-profile-card"
          className="p-4 bg-white border border-neutral-200 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono uppercase tracking-[0.16em] px-1.5 py-0.5 border ${
                    product.store.isOfficialStore
                      ? "bg-[#185B37] text-white border-[#185B37]"
                      : "bg-neutral-100 text-neutral-800 border-neutral-300"
                  }`}
                >
                  {product.store.isOfficialStore
                    ? "OFFICIAL STORE"
                    : "STAR SELLER"}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {product.store.id}
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#0A0A0A] mt-1">
                {product.store.name}
              </h3>
              <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#185B37]" />
                Origin: <strong className="text-[#0A0A0A]">{product.store.city}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200 py-2 text-center text-xs">
            <div>
              <div className="font-mono font-bold text-[#0A0A0A]">4.9/5.0</div>
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">
                Kurasi
              </div>
            </div>
            <div>
              <div className="font-mono font-bold text-[#185B37]">±15m</div>
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">
                Respon
              </div>
            </div>
            <div>
              <div className="font-mono font-bold text-[#0A0A0A]">100%</div>
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">
                Otentik
              </div>
            </div>
          </div>

          <Link
            href={`/?store=${encodeURIComponent(product.store.id)}`}
            className="block w-full text-center py-2 border border-neutral-300 hover:border-[#0A0A0A] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-colors"
          >
            Kunjungi Katalog {product.store.name}
          </Link>
        </div>
      </div>

      {/* Right Column: Sticky Purchase Box */}
      <div className="lg:col-span-3">
        <div className="sticky top-20 p-5 bg-white border border-[#0A0A0A] space-y-5">
          <div className="border-b border-neutral-200 pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
              ALOKASI PESANAN
            </span>
            <h3 className="font-serif text-lg font-semibold text-[#0A0A0A] mt-0.5">
              Konfigurasi Varian
            </h3>
          </div>

          <div className="p-3 bg-[#FAFAFA] border border-neutral-200 text-xs space-y-1">
            <div className="font-semibold text-[#0A0A0A]" data-testid="summary-variant-label">
              {selectedVariant.color} / Ukuran {selectedVariant.size}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono" data-testid="summary-variant-id">
              VAR_ID: {selectedVariant.id}
            </div>
          </div>

          {/* Quantity Adjuster */}
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-neutral-300">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-neutral-100 text-[#0A0A0A]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 font-mono font-semibold text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(selectedVariant.stock, q + 1))
                }
                className="p-2 hover:bg-neutral-100 text-[#0A0A0A]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              STOK: <strong className="text-[#0A0A0A]">{selectedVariant.stock}</strong>
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-baseline justify-between pt-3 border-t border-neutral-200">
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Subtotal
            </span>
            <span className="font-mono text-lg font-bold text-[#0A0A0A]">
              {formatIDR(finalPrice * quantity)}
            </span>
          </div>

          {addedFeedback && (
            <div className="p-3 bg-[#185B37]/10 border border-[#185B37] text-[#185B37] text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>
                Ditambahkan ke Tas (Grup <strong>{product.store.name}</strong>)
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              id="add-to-cart-btn"
              onClick={() => handleAddToCart(false)}
              className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#185B37] text-white font-semibold text-[11px] uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />+ Masukkan ke Tas
            </button>
            <button
              type="button"
              id="buy-now-btn"
              onClick={() => handleAddToCart(true)}
              className="w-full py-2.5 px-4 border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white font-semibold text-[11px] uppercase tracking-[0.18em] transition-colors"
            >
              Lanjut ke Checkout
            </button>
          </div>

          {/* Guarantees */}
          <div className="pt-3 border-t border-neutral-200 space-y-2 text-[11px] text-neutral-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#185B37] flex-shrink-0" />
              <span>Jaminan Otentikasi &amp; Proteksi Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-[#185B37] flex-shrink-0" />
              <span>Split-Order Otomatis dari {product.store.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Size Chart */}
      {showSizeChart && (
        <div
          id="size-chart-modal"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white max-w-xl w-full p-6 border border-[#0A0A0A] space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400 block">
                  MEASUREMENT SPECIFICATION
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#0A0A0A]">
                  Panduan Ukuran Standar Atelier
                </h3>
              </div>
              <button
                type="button"
                id="close-size-chart-btn"
                onClick={() => setShowSizeChart(false)}
                className="p-1.5 border border-neutral-200 hover:border-[#0A0A0A] text-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apparel Table */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                1. Atasan, Kemeja Batik, Linen &amp; Outerwear (S — XL)
              </h4>
              <div className="border border-neutral-200">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-[#FAFAFA] text-[#0A0A0A] border-b border-neutral-200">
                    <tr>
                      <th className="p-2.5">SIZE</th>
                      <th className="p-2.5">CHEST (CM)</th>
                      <th className="p-2.5">LENGTH (CM)</th>
                      <th className="p-2.5">EST. WEIGHT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="p-2.5 font-bold">S</td>
                      <td className="p-2.5">52 cm</td>
                      <td className="p-2.5">68 cm</td>
                      <td className="p-2.5">48 - 58 kg</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">M</td>
                      <td className="p-2.5">55 cm</td>
                      <td className="p-2.5">70 cm</td>
                      <td className="p-2.5">59 - 68 kg</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">L</td>
                      <td className="p-2.5">58 cm</td>
                      <td className="p-2.5">73 cm</td>
                      <td className="p-2.5">69 - 78 kg</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XL</td>
                      <td className="p-2.5">61 cm</td>
                      <td className="p-2.5">75 cm</td>
                      <td className="p-2.5">79 - 92 kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footwear Table */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                2. Footwear / Sepatu Sneakers &amp; Loafers (EU 39 — 44)
              </h4>
              <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
                {[
                  { eu: "39", cm: "24.5 cm" },
                  { eu: "40", cm: "25.0 cm" },
                  { eu: "41", cm: "26.0 cm" },
                  { eu: "42", cm: "26.5 cm" },
                  { eu: "43", cm: "27.5 cm" },
                  { eu: "44", cm: "28.0 cm" },
                ].map((s) => (
                  <div
                    key={s.eu}
                    className="p-2 bg-[#FAFAFA] border border-neutral-200"
                  >
                    <div className="font-bold text-[#0A0A0A]">EU {s.eu}</div>
                    <div className="text-[10px] text-neutral-500">{s.cm}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="px-5 py-2 bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.18em]"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
