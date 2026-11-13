"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import { SeedStore, SeedUser } from "../../prisma/seed-data";

const BANNER_PRESETS = [
  {
    label: "Butik Industrial Streetwear",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80",
  },
  {
    label: "Atelier Batik & Linen Modern",
    url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&auto=format&fit=crop&q=80",
  },
  {
    label: "Minimalist Fashion Loft",
    url: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1400&auto=format&fit=crop&q=80",
  },
];

export function SellerSettingsClient({
  store,
}: {
  store: SeedStore & { owner: SeedUser };
}) {
  const router = useRouter();
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [city, setCity] = useState(store.city);
  const [bannerUrl, setBannerUrl] = useState(
    store.bannerUrl || BANNER_PRESETS[0].url
  );
  const [description, setDescription] = useState(
    store.description ||
      "Toko fashion resmi terverifikasi di platform multi-tenant FashionHub."
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setName(store.name);
    setSlug(store.slug);
    setCity(store.city);
    setBannerUrl(store.bannerUrl || BANNER_PRESETS[0].url);
    setDescription(
      store.description ||
        "Toko fashion resmi terverifikasi di platform multi-tenant FashionHub."
    );
  }, [store]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/seller/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          city,
          bannerUrl,
          description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        router.refresh();
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      data-testid="seller-settings-view"
    >
      {/* Left Column: Settings Form */}
      <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 space-y-5">
        <div className="border-b border-neutral-200 pb-3">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#185B37] font-semibold mb-1">
            <Lock className="w-3 h-3" />
            ISOLATED STORE CONFIGURATION • WHERE id = &quot;{store.id}&quot;
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
            Pengaturan Profil Rumah Mode
          </h2>
        </div>

        {savedSuccess && (
          <div
            id="settings-saved-banner"
            className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] text-xs font-medium flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
            <span>
              Profil toko <strong>{name}</strong> berhasil diperbarui di
              database MySQL.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
              Nama Toko (Tenant Name) *
            </label>
            <input
              type="text"
              id="input-store-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-semibold text-[#0A0A0A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                Slug URL Toko *
              </label>
              <input
                type="text"
                id="input-store-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-mono font-bold text-[#185B37]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
                Kota Pengiriman *
              </label>
              <select
                id="input-store-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-semibold text-[#0A0A0A] bg-white"
              >
                {[
                  "Kota Bandung",
                  "Jakarta Selatan",
                  "Jakarta Pusat",
                  "Kota Surabaya",
                  "Kota Yogyakarta",
                  "Kota Denpasar",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
              URL Fotografi Banner Toko *
            </label>
            <input
              type="url"
              id="input-store-banner"
              required
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-3.5 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs font-mono"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setBannerUrl(preset.url)}
                  className="px-2.5 py-1 bg-[#FAFAFA] border border-neutral-200 hover:border-[#0A0A0A] text-neutral-700 text-[10px] font-medium transition-colors"
                >
                  Preset: {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
              Manifesto &amp; Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-neutral-300 focus:border-[#0A0A0A] focus:outline-none text-xs leading-relaxed text-neutral-700"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-end">
            <button
              type="submit"
              id="save-store-settings-btn"
              disabled={saving}
              className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#185B37] text-white text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center gap-2 transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan Pengaturan Profil Toko
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Editorial Store Card Preview */}
      <div className="lg:col-span-5">
        <div className="bg-white border border-neutral-200 overflow-hidden">
          <div className="h-44 w-full relative bg-[#0A0A0A]">
            <img
              src={bannerUrl}
              alt={name}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-300">
                LIVE PREVIEW KARTU PROFIL TENANT
              </span>
              <h3 className="font-serif text-2xl font-semibold mt-0.5 truncate">
                {name}
              </h3>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <p className="text-neutral-600 leading-relaxed">{description}</p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
              <div className="p-3 bg-[#FAFAFA] border border-neutral-200">
                <div className="text-[9px] text-neutral-400 uppercase tracking-[0.16em] font-semibold">
                  Kota Pengiriman
                </div>
                <div className="font-semibold text-[#0A0A0A] mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#185B37]" />
                  {city}
                </div>
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-neutral-200">
                <div className="text-[9px] text-neutral-400 uppercase tracking-[0.16em] font-semibold">
                  Tenant Isolation ID
                </div>
                <div className="font-mono font-bold text-[#185B37] mt-1">
                  {store.id} (/{slug})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
