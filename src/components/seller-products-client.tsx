"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  Lock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { EnrichedProduct } from "@/lib/prisma";
import { SeedStore } from "../../prisma/seed-data";
import { formatIDR, getDiscountPercent } from "@/lib/utils";

const CATEGORIES = [
  "Local Pride",
  "Streetwear",
  "Casual Shirt",
  "Outerwear",
  "Denim",
  "Sneakers Lokal",
];

const SIZES_LIST = ["S", "M", "L", "XL", "39", "40", "41", "42", "43", "44"];

const UNSPLASH_PRESETS = [
  {
    label: "Bomber / Jacket Streetwear",
    url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Kemeja Batik / Linen",
    url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Heavyweight Hoodie",
    url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Sneakers Footwear",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
  },
];

interface VariantRow {
  size: string;
  color: string;
  stock: number;
}

export function SellerProductsClient({
  store,
  initialProducts,
}: {
  store: SeedStore;
  initialProducts: EnrichedProduct[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<EnrichedProduct[]>(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(
    store.id === "store-b" || store.id === "store-e"
      ? "Local Pride"
      : store.id === "store-c"
      ? "Casual Shirt"
      : store.id === "store-d"
      ? "Sneakers Lokal"
      : "Streetwear"
  );
  const [basePrice, setBasePrice] = useState("450000");
  const [discountPrice, setDiscountPrice] = useState("329000");
  const [imageUrl, setImageUrl] = useState(UNSPLASH_PRESETS[0].url);
  const [isFeatured, setIsFeatured] = useState(true);
  const [variants, setVariants] = useState<VariantRow[]>([
    { size: "S", color: "Jet Black", stock: 15 },
    { size: "M", color: "Jet Black", stock: 25 },
    { size: "L", color: "Jet Black", stock: 20 },
    { size: "XL", color: "Olive Green", stock: 12 },
  ]);

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { size: "L", color: "Jet Black", stock: 10 },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (
    idx: number,
    field: keyof VariantRow,
    val: string | number
  ) => {
    setVariants((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleGenerateStandardMatrix = (colorName: string) => {
    setVariants([
      { size: "S", color: colorName, stock: 15 },
      { size: "M", color: colorName, stock: 25 },
      { size: "L", color: colorName, stock: 25 },
      { size: "XL", color: colorName, stock: 15 },
    ]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          basePrice: Number(basePrice),
          discountPrice: discountPrice ? Number(discountPrice) : null,
          imageUrl,
          isFeatured,
          variants,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) => [data.product, ...prev]);
        setShowAddModal(false);
        setName("");
        setSuccessBanner(
          `Siluet "${data.product.name}" beserta ${data.product.variants.length} varian berhasil disimpan ke MySQL (storeId="${store.id}").`
        );
        router.refresh();
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingId(productId);
    try {
      const res = await fetch(`/api/seller/products?id=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5" data-testid="seller-products-view">
      {/* Top Action Bar */}
      <div className="bg-white border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#185B37] font-semibold mb-1">
            <Lock className="w-3 h-3" />
            ISOLATED CATALOG • WHERE storeId = &quot;{store.id}&quot;
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
            Manajemen Produk Toko — {store.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Menampilkan <strong>{products.length} SKU</strong> eksklusif milik
            tenant Anda.
          </p>
        </div>

        <button
          type="button"
          id="open-add-product-modal-btn"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Produk Baru
        </button>
      </div>

      {successBanner && (
        <div
          id="product-created-banner"
          className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] text-xs font-medium flex items-center gap-2.5"
        >
          <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFAFA] text-neutral-500 uppercase tracking-[0.16em] text-[10px] font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Siluet Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Matriks Varian (Size / Color / Stock)</th>
                <th className="py-3.5 px-4">Total Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((prod) => {
                const disc = getDiscountPercent(
                  prod.basePrice,
                  prod.discountPrice
                );
                const totalStock = prod.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0
                );

                return (
                  <tr
                    key={prod.id}
                    data-testid={`seller-product-row-${prod.id}`}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 max-w-sm">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-11 h-14 object-cover border border-neutral-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-[#0A0A0A] text-xs line-clamp-2">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {prod.id} •{" "}
                            <span className="text-[#185B37] font-semibold">
                              {prod.storeId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-neutral-700 font-mono text-[10px] uppercase">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-[#0A0A0A] text-xs">
                        {formatIDR(prod.discountPrice ?? prod.basePrice)}
                      </div>
                      {disc > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-semibold px-1 bg-[#9E2A2B] text-white">
                            -{disc}%
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through">
                            {formatIDR(prod.basePrice)}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-md font-mono">
                        {prod.variants.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FAFAFA] border border-neutral-200 text-[10px]"
                          >
                            <strong className="text-[#0A0A0A]">{v.size}</strong>
                            <span className="text-neutral-500">{v.color}</span>
                            <span className="font-bold text-[#185B37]">
                              :{v.stock}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#0A0A0A]">
                      {totalStock} pcs
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/product/${prod.slug}`}
                          title="Lihat di Marketplace"
                          className="p-1.5 border border-neutral-200 text-neutral-600 hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === prod.id}
                          onClick={() => handleDeleteProduct(prod.id)}
                          title="Hapus Produk"
                          className="p-1.5 border border-neutral-200 text-neutral-400 hover:border-[#9E2A2B] hover:text-[#9E2A2B]"
                        >
                          {deletingId === prod.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9E2A2B]" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Tambah Produk Baru + Matriks Varian */}
      {showAddModal && (
        <div
          id="add-product-modal"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white max-w-2xl w-full p-6 border border-[#0A0A0A] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#185B37] font-semibold block">
                  NEW ARCHIVE ENTRY • storeId=&quot;{store.id}&quot;
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#0A0A0A]">
                  Tambah Produk Baru — {store.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 border border-neutral-200 hover:border-[#0A0A0A] text-[#0A0A0A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                    Nama Siluet Produk *
                  </label>
                  <input
                    type="text"
                    id="input-product-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Work Jacket Canvas Washed Heavyweight"
                    className="w-full px-3 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                    Kategori *
                  </label>
                  <select
                    id="input-product-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-medium bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                    Harga Dasar (IDR) *
                  </label>
                  <input
                    type="number"
                    id="input-base-price"
                    required
                    min={1000}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                    Harga Diskon (IDR)
                  </label>
                  <input
                    type="number"
                    id="input-discount-price"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Kosongkan jika harga normal"
                    className="w-full px-3 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-mono font-bold text-[#185B37]"
                  />
                </div>
              </div>

              {/* Photo URL + Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                  URL Fotografi Katalog *
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    id="input-image-url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-mono"
                  />
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-12 object-cover border border-neutral-300 flex-shrink-0"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {UNSPLASH_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className="px-2 py-1 bg-[#FAFAFA] border border-neutral-200 hover:border-[#0A0A0A] text-neutral-700 text-[10px] font-medium"
                    >
                      Preset: {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variant Matrix */}
              <div className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-[#0A0A0A] text-[10px] uppercase tracking-[0.18em]">
                      Matriks Varian Produk (ProductVariant MySQL)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateStandardMatrix("Washed Black")
                      }
                      className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-[#0A0A0A] text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]"
                    >
                      Set S-XL Otomatis
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="px-2.5 py-1 bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-wider"
                    >
                      + Baris Varian
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 border border-neutral-200 font-mono text-xs"
                    >
                      <div className="col-span-3">
                        <select
                          value={v.size}
                          onChange={(e) =>
                            handleVariantChange(idx, "size", e.target.value)
                          }
                          className="w-full font-bold text-[#0A0A0A] bg-transparent focus:outline-none text-xs"
                        >
                          {SIZES_LIST.map((sz) => (
                            <option key={sz} value={sz}>
                              SIZE {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-5">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) =>
                            handleVariantChange(idx, "color", e.target.value)
                          }
                          placeholder="Warna"
                          className="w-full font-sans font-medium text-[#0A0A0A] bg-transparent focus:outline-none text-xs"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) =>
                            handleVariantChange(
                              idx,
                              "stock",
                              Number(e.target.value)
                            )
                          }
                          className="w-full font-bold text-[#185B37] bg-transparent focus:outline-none text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1 text-neutral-400 hover:text-[#9E2A2B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-[#0A0A0A] text-[10px] font-semibold uppercase tracking-[0.16em]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-new-product-btn"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] flex items-center gap-2 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>Simpan Produk &amp; {variants.length} Varian</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
