import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/prisma";
import { FlashSaleBanner } from "@/components/flash-sale-banner";
import { ProductCard } from "@/components/product-card";
import ClothingRailHeroDemo from "@/components/ui/demo";

const FASHION_CATEGORIES = [
  "Semua",
  "Local Pride",
  "Streetwear",
  "Casual Shirt",
  "Outerwear",
  "Denim",
  "Sneakers Lokal",
];

export default function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; store?: string; guard?: string };
}) {
  const activeCategory = searchParams.category || "Semua";
  const searchQuery = searchParams.q || "";
  const storeFilter = searchParams.store || "";

  const allActiveProducts = db.getProducts();
  const filteredProducts = db.getProducts({
    category: activeCategory,
    search: searchQuery,
    storeId: storeFilter || undefined,
  });

  const activeStores = db
    .getAllStores()
    .filter((s) => s.status === "ACTIVE");

  const marketingConfig = db.getMarketingConfig();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Guard Notification if Buyer tried to access Seller/Superadmin route */}
      {searchParams.guard === "unauthorized_buyer" && (
        <div className="p-3.5 bg-white border border-[#9E2A2B] text-[#0A0A0A] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#9E2A2B] flex-shrink-0" />
            <span>
              <strong className="uppercase tracking-wider text-[#9E2A2B]">
                Akses Dibatasi (RBAC Guard):
              </strong>{" "}
              Akun <code className="font-mono font-semibold">USER (Budi - Buyer)</code>{" "}
              tidak memiliki otorisasi mengakses rute internal{" "}
              <code className="font-mono">/seller</code> atau{" "}
              <code className="font-mono">/superadmin</code>. Gunakan{" "}
              <strong>Role Switcher</strong> di kanan atas.
            </span>
          </div>
        </div>
      )}

      {/* Interactive 3D Physics Clothing Rail Hero Gallery */}
      <ClothingRailHeroDemo autoplay />

      {/* Architectural Tenant Directory Strip (Semua 5 Toko Brand Lokal Indonesia) */}
      <section className="space-y-3" data-testid="tenant-directory-section">
        <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Direktori Brand Lokal Indonesia &amp; Tenant Terverifikasi ({activeStores.length} Toko)
          </h2>
          <span className="text-[10px] font-mono text-neutral-400">
            KURASI LOCAL PRIDE • FILTER BY STORE_ID
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {activeStores.map((store) => {
            const isSelected = storeFilter === store.id;
            return (
              <div
                key={store.id}
                data-testid={`store-card-${store.id}`}
                className={`p-3.5 border transition-colors flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-[#0A0A0A] border-neutral-200 hover:border-[#0A0A0A]"
                }`}
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 border ${
                        store.isOfficialStore
                          ? isSelected
                            ? "border-[#185B37] bg-[#185B37] text-white"
                            : "border-[#185B37]/40 bg-[#185B37]/10 text-[#185B37]"
                          : isSelected
                          ? "border-neutral-700 text-neutral-300"
                          : "border-neutral-300 text-neutral-600"
                      }`}
                    >
                      {store.isOfficialStore ? "OFFICIAL STORE" : "STAR SELLER"}
                    </span>
                    <span
                      className={`text-[10px] font-mono truncate ${
                        isSelected ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      {store.city}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-semibold tracking-tight line-clamp-1">
                    {store.name}
                  </h3>
                  {store.description && (
                    <p
                      className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      {store.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-100/80 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? "text-neutral-300" : "text-neutral-500"
                    }`}
                  >
                    {store.productCount} Produk
                  </span>
                  <Link
                    href={isSelected ? "/" : `/?store=${store.id}#katalog-produk`}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] border flex items-center gap-1 flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-white text-[#0A0A0A] border-white"
                        : "bg-[#FAFAFA] hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] border-neutral-300"
                    }`}
                  >
                    {isSelected ? "Reset" : "Lihat Toko"}
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Flash Sale Countdown Banner */}
      <FlashSaleBanner products={allActiveProducts} config={marketingConfig} />

      {/* Editorial Category Filter & Catalog Header */}
      <section id="katalog-produk" className="space-y-5 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#185B37] block">
              INDONESIAN LOCAL PRIDE ARCHIVE • 5 CURATED TENANTS
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#0A0A0A] mt-0.5">
              Katalog Koleksi Brand Lokal Indonesia
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[11px] text-neutral-500 font-mono">
              MENAMPILKAN <strong className="text-[#0A0A0A]">{filteredProducts.length}</strong> PRODUK
              {searchQuery ? ` UNTUK "${searchQuery.toUpperCase()}"` : ""}
            </span>
            {(searchQuery || storeFilter || activeCategory !== "Semua") && (
              <Link
                href="/"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9E2A2B] underline underline-offset-4"
              >
                Reset Filter
              </Link>
            )}
          </div>
        </div>

        {/* Minimalist Category Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          data-testid="category-filter-bar"
        >
          {FASHION_CATEGORIES.map((cat) => {
            const isActive =
              activeCategory.toLowerCase() === cat.toLowerCase();
            const href =
              cat === "Semua"
                ? storeFilter
                  ? `/?store=${storeFilter}#katalog-produk`
                  : "/#katalog-produk"
                : `/?category=${encodeURIComponent(cat)}${
                    storeFilter ? `&store=${storeFilter}` : ""
                  }#katalog-produk`;
            return (
              <Link
                key={cat}
                href={href}
                className={`px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Main Cross-Tenant Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
            <h3 className="font-serif text-xl font-semibold text-[#0A0A0A]">
              Tidak Ada Produk yang Sesuai Filter
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Silakan pilih kategori lain atau atur ulang kata kunci pencarian
              untuk melihat seluruh koleksi Local Pride.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em]"
            >
              Tampilkan Semua Koleksi
            </Link>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            data-testid="product-grid"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
