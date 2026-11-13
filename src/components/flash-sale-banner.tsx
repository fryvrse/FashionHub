"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { EnrichedProduct } from "@/lib/prisma";
import type { MarketingConfig } from "../../prisma/seed-data";
import { formatIDR, getDiscountPercent } from "@/lib/utils";

export function FlashSaleBanner({
  products,
  config,
}: {
  products: EnrichedProduct[];
  config?: MarketingConfig;
}) {
  const initialSeconds =
    config?.flashSaleDurationSeconds || 2 * 3600 + 44 * 60 + 39;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (config && config.flashSaleActive === false) {
    return null;
  }

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const flashProducts = products
    .filter((p) => p.discountPrice && p.discountPrice < p.basePrice)
    .slice(0, 4);

  return (
    <section className="bg-[#0A0A0A] text-white border border-[#0A0A0A] p-5 md:p-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-block px-2 py-0.5 bg-[#9E2A2B] text-white font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
              {config?.flashSaleBadge || "ARCHIVE FLASH DISPATCH"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              LIMITED ALLOCATION
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-white">
            {config?.flashSaleTitle ||
              "Kurasi Fashion Lintas Tenant • Diskon s.d 35%"}
          </h2>
        </div>

        {/* Clean Tabular Countdown */}
        <div className="flex items-center gap-3 self-start lg:self-end">
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Berakhir Dalam
          </span>
          <div
            className="flex items-center gap-1 font-mono text-xs font-semibold"
            data-testid="flash-sale-countdown"
          >
            <span className="bg-neutral-900 border border-neutral-700 text-white px-2.5 py-1">
              {hours}H
            </span>
            <span className="text-neutral-500">:</span>
            <span className="bg-neutral-900 border border-neutral-700 text-white px-2.5 py-1">
              {minutes}M
            </span>
            <span className="text-neutral-500">:</span>
            <span className="bg-[#9E2A2B] text-white px-2.5 py-1">
              {seconds}S
            </span>
          </div>
        </div>
      </div>

      {/* Editorial 4-Column Flash Sale Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {flashProducts.map((product) => {
          const disc = getDiscountPercent(
            product.basePrice,
            product.discountPrice
          );
          const totalStock = product.variants.reduce(
            (sum, v) => sum + v.stock,
            0
          );

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group bg-neutral-950 border border-neutral-800 hover:border-white transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 border-b border-neutral-800">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#9E2A2B] text-white font-mono text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5">
                    -{disc}%
                  </span>
                  <span className="absolute bottom-2.5 left-2.5 bg-[#0A0A0A]/90 text-neutral-200 text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 border border-neutral-700">
                    {product.store.isOfficialStore
                      ? "● OFFICIAL STORE"
                      : "★ STAR SELLER"}
                  </span>
                </div>

                <div className="p-3.5 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400 truncate">
                    {product.store.name} — {product.store.city}
                  </p>
                  <h3 className="text-xs font-medium text-white line-clamp-2 leading-relaxed group-hover:underline underline-offset-4">
                    {product.name}
                  </h3>
                </div>
              </div>

              <div className="px-3.5 pb-3.5 pt-2 border-t border-neutral-900 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold text-white">
                      {formatIDR(product.discountPrice || product.basePrice)}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500 line-through">
                      {formatIDR(product.basePrice)}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                </div>

                {/* Minimal Hairline Allocation Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1 bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-[#185B37]"
                      style={{ width: "76%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-neutral-400 font-mono">
                    <span>TERSEDIA</span>
                    <span className="text-white">{totalStock} PCS</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
