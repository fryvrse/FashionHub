import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/prisma";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductCard } from "@/components/product-card";

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = db.getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const otherProducts = db
    .getProducts()
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Editorial Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500 overflow-x-auto whitespace-nowrap border-b border-neutral-200 pb-3">
        <Link href="/" className="hover:text-[#0A0A0A] font-semibold">
          Beranda
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-400" />
        <Link
          href={`/?category=${encodeURIComponent(product.category)}`}
          className="hover:text-[#0A0A0A] font-semibold"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-400" />
        <Link
          href={`/?store=${product.store.id}`}
          className="hover:text-[#0A0A0A] font-semibold"
        >
          {product.store.name}
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-400" />
        <span className="text-[#0A0A0A] font-bold truncate">
          {product.name}
        </span>
      </nav>

      {/* Main Product Interactive View */}
      <ProductDetailClient product={product} />

      {/* Product Specifications & Multi-Tenant Info */}
      <section className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="border-b border-neutral-200 pb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
            Deskripsi Produk &amp; Spesifikasi Bahan
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
            SKU: {product.id.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#FAFAFA] p-4 border border-neutral-200">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 block">
              Brand Lokal / Tenant
            </span>
            <strong className="text-[#0A0A0A] mt-0.5 block">
              {product.store.name} ({product.store.city})
            </strong>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 block">
              Detail Material &amp; Konstruksi Kain
            </span>
            <strong className="text-[#185B37] font-mono mt-0.5 block">
              {product.material || "Cotton Combed 24s / Linen Rami Premium"}
            </strong>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 block">
              Kategori &amp; Matriks Varian
            </span>
            <strong className="text-[#0A0A0A] font-mono mt-0.5 block">
              {product.category} • {product.variants.length} Varian Ukuran
            </strong>
          </div>
        </div>

        <p className="text-xs text-neutral-700 leading-relaxed max-w-4xl">
          {product.description ||
            `Koleksi kurasi Local Pride dari ${product.store.name} (${product.store.city}) yang dirancang dengan presisi pola, konstruksi jahitan rantai padat, dan material pilihan berstandar tinggi.`}
        </p>

        <p className="text-[11px] text-neutral-500 leading-relaxed max-w-4xl border-t border-neutral-100 pt-3">
          Transaksi atas produk ini diproses secara independen melalui entitas{" "}
          <code className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-200 text-[#0A0A0A]">
            SubOrder
          </code>{" "}
          khusus tenant <strong>{product.store.id}</strong> ({product.store.name}).
        </p>
      </section>

      {/* Cross-Tenant Recommendations */}
      <section className="space-y-4">
        <div className="border-b border-neutral-200 pb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
            Kurasi Brand Lokal Lainnya
          </h2>
          <Link
            href="/"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 hover:text-[#0A0A0A]"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {otherProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
