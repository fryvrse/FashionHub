import React from "react";
import Link from "next/link";
import { EnrichedProduct } from "@/lib/prisma";
import { formatIDR, getDiscountPercent } from "@/lib/utils";

export function ProductCard({ product }: { product: EnrichedProduct }) {
  const discount = getDiscountPercent(
    product.basePrice,
    product.discountPrice
  );
  const finalPrice = product.discountPrice ?? product.basePrice;
  const uniqueSizes = Array.from(
    new Set(product.variants.map((v) => v.size))
  );

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-white border border-neutral-200 hover:border-[#0A0A0A] transition-colors duration-150 flex flex-col justify-between"
    >
      <div>
        {/* Vertical Portrait Fashion Image Container (3:4 Ratio) */}
        <div className="relative aspect-[3/4] w-full bg-[#F3F3F1] overflow-hidden border-b border-neutral-200">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />

          {/* Top-Left Functional Sale Tag */}
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-[#9E2A2B] text-white text-[10px] font-mono font-semibold uppercase tracking-[0.14em] px-2 py-0.5">
              -{discount}%
            </span>
          )}

          {/* Top-Right Category Label */}
          <span className="absolute top-2.5 right-2.5 bg-white/95 text-[#0A0A0A] border border-neutral-200 text-[9px] font-semibold uppercase tracking-[0.16em] px-2 py-0.5">
            {product.category}
          </span>
        </div>

        {/* Editorial Product Details */}
        <div className="p-3.5 space-y-1.5">
          {/* Tenant Provenance Line */}
          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em]">
            <span className="font-semibold text-neutral-500 truncate">
              {product.store.name}
            </span>
            {product.store.isOfficialStore ? (
              <span className="text-[#185B37] font-bold flex-shrink-0">
                ● OFFICIAL
              </span>
            ) : (
              <span className="text-neutral-700 font-semibold flex-shrink-0">
                ★ STAR SELLER
              </span>
            )}
          </div>

          {/* Garment Title */}
          <h3 className="text-[13px] font-medium text-[#0A0A0A] group-hover:underline underline-offset-4 leading-snug line-clamp-2 min-h-[2.25rem]">
            {product.name}
          </h3>

          {/* Material Spec Line */}
          {product.material && (
            <p className="text-[10px] font-mono text-neutral-500 truncate">
              Bahan: {product.material}
            </p>
          )}

          {/* Price Block */}
          <div className="pt-1 flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-[#0A0A0A]">
              {formatIDR(finalPrice)}
            </span>
            {discount > 0 && (
              <span className="font-mono text-[11px] text-neutral-400 line-through">
                {formatIDR(product.basePrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact Footer: Origin City & Sizes */}
      <div className="px-3.5 py-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-[0.1em]">
        <span className="truncate">{product.store.city}</span>
        <span className="font-mono text-neutral-700">
          {uniqueSizes.join(" / ")}
        </span>
      </div>
    </Link>
  );
}
