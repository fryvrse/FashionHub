"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import type { MarketingConfig, PromoBannerItem } from "../../prisma/seed-data";

export function SuperadminMarketingClient({
  initialConfig,
}: {
  initialConfig: MarketingConfig;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<MarketingConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const hoursVal = Math.floor(config.flashSaleDurationSeconds / 3600);
  const minutesVal = Math.floor((config.flashSaleDurationSeconds % 3600) / 60);

  const handleDurationChange = (hours: number, minutes: number) => {
    const h = Math.max(0, Math.min(99, hours || 0));
    const m = Math.max(0, Math.min(59, minutes || 0));
    setConfig((prev) => ({
      ...prev,
      flashSaleDurationSeconds: h * 3600 + m * 60 + 39,
    }));
  };

  const handleBannerChange = (
    idx: number,
    field: keyof PromoBannerItem,
    value: string | boolean
  ) => {
    setConfig((prev) => {
      const next = [...prev.promoBanners];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, promoBanners: next };
    });
  };

  const handleAddBanner = () => {
    const newBanner: PromoBannerItem = {
      id: `banner-${Date.now()}`,
      title: "Koleksi Baru: Kurasi Fashion Akhir Tahun",
      subtitle: "Diskon Lintas Tenant & Cashback Saldo Toko",
      badge: "NEW CAMPAIGN",
      imageUrl:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80",
      ctaText: "Belanja Sekarang",
      ctaLink: "/#katalog-produk",
      active: true,
    };
    setConfig((prev) => ({
      ...prev,
      promoBanners: [...prev.promoBanners, newBanner],
    }));
  };

  const handleRemoveBanner = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      promoBanners: prev.promoBanners.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success && data.marketing) {
        setConfig(data.marketing);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 4000);
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to save marketing config", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="space-y-5"
      data-testid="superadmin-marketing-view"
    >
      {savedToast && (
        <div
          className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] flex items-center justify-between gap-3 text-xs"
          data-testid="marketing-saved-toast"
        >
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
            <span className="font-medium">
              Konfigurasi Banner &amp; Flash Sale Global berhasil disimpan dan
              langsung diperbarui di Beranda Pembeli!
            </span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-[#185B37] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1"
          >
            Cek Beranda <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
            EDITORIAL CAMPAIGN &amp; FLASH DISPATCH CONTROL
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A] mt-0.5">
            Manajemen Banner Utama &amp; Flash Sale Global
          </h2>
        </div>

        <button
          type="submit"
          disabled={saving}
          data-testid="save-marketing-btn"
          className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Simpan Perubahan Global
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Flash Sale Global Controller */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="font-serif text-xl font-semibold text-[#0A0A0A]">
              Pengaturan Flash Sale Countdown
            </h3>
            <label className="inline-flex items-center gap-2 cursor-pointer text-[10px] font-mono uppercase tracking-wider font-bold">
              <input
                type="checkbox"
                checked={config.flashSaleActive}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    flashSaleActive: e.target.checked,
                  }))
                }
                className="w-3.5 h-3.5 accent-[#185B37]"
              />
              <span
                className={
                  config.flashSaleActive ? "text-[#185B37]" : "text-[#9E2A2B]"
                }
              >
                {config.flashSaleActive ? "● AKTIF" : "NONAKTIF"}
              </span>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-1">
                Tajuk Utama Kampanye Flash Sale
              </label>
              <input
                type="text"
                value={config.flashSaleTitle}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    flashSaleTitle: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-neutral-300 font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-1">
                  Label Badge Kampanye
                </label>
                <input
                  type="text"
                  value={config.flashSaleBadge}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      flashSaleBadge: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 text-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 mb-1">
                  Komisi Platform (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={config.commissionRatePercent}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      commissionRatePercent: Number(e.target.value) || 5,
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 font-mono font-bold text-[#0A0A0A]"
                />
              </div>
            </div>

            {/* Countdown Timer Duration Control */}
            <div className="p-4 bg-[#FAFAFA] border border-neutral-200 space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] block">
                Durasi Countdown Flash Sale (Jam &amp; Menit)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-neutral-500 block mb-1">
                    Durasi Jam
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={hoursVal}
                    onChange={(e) =>
                      handleDurationChange(Number(e.target.value), minutesVal)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block mb-1">
                    Durasi Menit
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutesVal}
                    onChange={(e) =>
                      handleDurationChange(hoursVal, Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview of Flash Sale Header */}
            <div className="bg-[#0A0A0A] text-white p-4 space-y-2 border border-[#0A0A0A]">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                LIVE PREVIEW TAMPILAN BERANDA PEMBELI
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 bg-[#9E2A2B] text-white font-mono text-[9px] font-semibold uppercase tracking-[0.16em]">
                    {config.flashSaleBadge}
                  </span>
                  <div className="font-serif text-lg font-semibold">
                    {config.flashSaleTitle}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-xs">
                  <span className="bg-neutral-900 border border-neutral-700 px-2 py-1">
                    {String(hoursVal).padStart(2, "0")}H
                  </span>
                  <span>:</span>
                  <span className="bg-neutral-900 border border-neutral-700 px-2 py-1">
                    {String(minutesVal).padStart(2, "0")}M
                  </span>
                  <span>:</span>
                  <span className="bg-[#9E2A2B] px-2 py-1">39S</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Hero & Promo Banner Carousel Controller */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="font-serif text-xl font-semibold text-[#0A0A0A]">
              Konten Banner Editorial ({config.promoBanners.length} Slide)
            </h3>
            <button
              type="button"
              onClick={handleAddBanner}
              className="px-3 py-1.5 bg-[#FAFAFA] border border-neutral-300 hover:border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Tambah Slide
            </button>
          </div>

          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
            {config.promoBanners.map((banner, idx) => (
              <div
                key={banner.id}
                className="p-4 border border-neutral-200 bg-[#FAFAFA] space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                    SLIDE #{idx + 1} — {banner.badge}
                  </span>
                  {config.promoBanners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(idx)}
                      className="text-[#9E2A2B] inline-flex items-center gap-1 text-[10px] font-semibold uppercase"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  )}
                </div>

                <div className="relative h-28 overflow-hidden bg-[#0A0A0A] border border-neutral-300">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-end text-white bg-black/40">
                    <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-neutral-300">
                      {banner.badge}
                    </span>
                    <div className="font-serif text-base font-semibold leading-tight">
                      {banner.title}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">
                      Judul Banner
                    </label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) =>
                        handleBannerChange(idx, "title", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">
                      Sub-judul Kampanye
                    </label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) =>
                        handleBannerChange(idx, "subtitle", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">
                      URL Gambar Banner
                    </label>
                    <input
                      type="url"
                      value={banner.imageUrl}
                      onChange={(e) =>
                        handleBannerChange(idx, "imageUrl", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
