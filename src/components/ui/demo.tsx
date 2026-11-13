"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";

export const RAIL_DEMO_ITEMS: (RailGarment & { slug?: string; tenant?: string })[] = [
  {
    id: "bone-tee",
    name: "Heavyweight Oversized Basic Tee · Pure White",
    kind: "tee",
    color: "#EFEBE2",
    trim: "#D8D2C5",
    tag: "Rp 150rb",
    slug: "heavyweight-oversized-basic-tee-pure-white",
    tenant: "StreetCult Official (Bandung — Official Store)",
    description:
      "Kaos polos esensial 100% Cotton Combed 24s Knitto Bandung dengan potongan boxy drop-shoulder.",
    details: ["Cotton Combed 24s", "Boxy Basic Tee", "StreetCult Official"],
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "cc-graphic",
    name: "Graphic Streetwear Tee 'Underground Radar' · Black",
    kind: "tee",
    color: "#1F2428",
    trim: "#101214",
    tag: "Rp 175rb",
    slug: "graphic-streetwear-tee-underground-radar-black",
    tenant: "StreetCult Official (Bandung — Official Store)",
    description:
      "Kaos bergambar sablon plastisol high-density berbahan Cotton Combed 24s edisi skena Bandung.",
    details: ["Cotton Combed 24s", "Plastisol HD", "Official Store"],
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "oxford-sky",
    name: "Kemeja Linen Oversized 'Botanica' · Linen Rami",
    kind: "shirt",
    color: "#9CC9E3",
    trim: "#7BAECF",
    tag: "Rp 249rb",
    slug: "kemeja-linen-oversized-botanica-linen-rami",
    tenant: "Cotton & Sage Daily (Jakarta — Star Seller)",
    description:
      "Kemeja 100% Linen Rami Premium organik bergaya Cottonink & Minimal yang sejuk untuk iklim tropis.",
    details: ["Linen Rami Premium", "Relaxed Cut", "Cotton & Sage Daily"],
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "cardigan-olive",
    name: "Outer Tenun Modern 'Nusantara Kimono' · ATBM",
    kind: "jacket",
    color: "#6E7B4E",
    trim: "#535E39",
    tag: "Rp 425rb",
    slug: "outer-tenun-modern-wanita-nusantara-kimono",
    tenant: "Batik Kencana Modern (Solo — Official Store)",
    description:
      "Outer kimono wanita berbahan Tenun Ikat ATBM asli tenunan tangan dipadukan dengan list Linen Rami.",
    details: ["Tenun Ikat ATBM", "Linen Rami", "Batik Kencana Solo"],
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "hoodie-heather",
    name: "Oversized Boxy Hoodie 'Garuda Noir' · 330GSM",
    kind: "hoodie",
    color: "#525860",
    trim: "#3B4046",
    tag: "Rp 319rb",
    slug: "oversized-heavyweight-boxy-hoodie-washed-charcoal",
    tenant: "StreetCult Official (Bandung — Official Store)",
    description:
      "Hoodie Cotton Fleece 330GSM Heavyweight dengan potongan drop-shoulder boxy khas streetwear Bandung.",
    details: ["Cotton Fleece 330GSM", "No-Drawstring Cut", "StreetCult Bdg"],
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sweat-lilac",
    name: "Kemeja Batik Slimfit 'Parang Kencana' · Primisima",
    kind: "shirt",
    color: "#8D6346",
    trim: "#65432D",
    tag: "Rp 349rb",
    slug: "kemeja-batik-slimfit-pria-parang-kencana",
    tenant: "Batik Kencana Modern (Solo — Official Store)",
    description:
      "Kemeja batik slimfit pria berbahan Katun Primisima Sogan Solo berlapis Furing Hero yang adem.",
    details: ["Katun Primisima", "Slim Fit Furing", "Batik Kencana Solo"],
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "polo-forest",
    name: "Coach Jacket Windbreaker 'Archipelago' · Camel Tan",
    kind: "jacket",
    color: "#1E5638",
    trim: "#143D27",
    tag: "Rp 329rb",
    slug: "coach-jacket-windbreaker-archipelago-camel-tan",
    tenant: "StreetCult Official (Bandung — Official Store)",
    description:
      "Jaket coach windbreaker berbahan Taslan Parachute tahan angin dengan kancing snap logam.",
    details: ["Taslan Parachute", "Water-Repellent", "StreetCult Official"],
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "henley-brick",
    name: "Tunik Polos Asimetris 'Nabila' · Katun Toyobo",
    kind: "shirt",
    color: "#B05139",
    trim: "#8A3B27",
    tag: "Rp 239rb",
    slug: "tunik-polos-asimetris-nabila-katun-toyobo",
    tenant: "Hijabika Modest (Yogyakarta — Star Seller)",
    description:
      "Tunik muslimah modern berbahan Katun Toyobo Fodu mix Linen Rami yang halus dan tidak menerawang.",
    details: ["Katun Toyobo Fodu", "Wudhu Friendly", "Hijabika Yogyakarta"],
    image:
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "breton",
    name: "Setelan Wanita 'Senopati Co-Ord' · Linen Rami",
    kind: "knit",
    color: "#DFD9CA",
    trim: "#C7BFA9",
    tag: "Rp 419rb",
    slug: "setelan-linen-rami-wanita-senopati-coord",
    tenant: "Cotton & Sage Daily (Jakarta — Star Seller)",
    description:
      "Setelan one-set atasan dan celana kulot highwaist berbahan Linen Rami Premium ala Cottonink.",
    details: ["Linen Rami Premium", "One-Set Kulot", "Cotton & Sage"],
    image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "oversized-ochre",
    name: "Dress Abaya Modern 'Layla Arabian' · Crinkle Silk",
    kind: "coat",
    color: "#C88A32",
    trim: "#9E6A20",
    tag: "Rp 435rb",
    slug: "dress-abaya-modern-layla-arabian-silk",
    tenant: "Hijabika Modest (Yogyakarta — Star Seller)",
    description:
      "Dress Abaya modern berbahan Arabian Crinkle Silk ironless dengan detail bordir tangan halus.",
    details: ["Arabian Crinkle Silk", "Busui Friendly", "Hijabika Modest"],
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    backImage:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  },
];

export default function ClothingRailHeroDemo({
  autoplay = true,
}: {
  autoplay?: boolean;
}) {
  const [visualMode, setVisualMode] = React.useState<"studio3d" | "unsplash">(
    "studio3d"
  );

  const itemsForRail = React.useMemo(() => {
    if (visualMode === "studio3d") {
      return RAIL_DEMO_ITEMS.map(({ image, backImage, sideImage, ...rest }) => ({
        ...rest,
      }));
    }
    return RAIL_DEMO_ITEMS;
  }, [visualMode]);

  return (
    <div
      data-rail-demo
      className="relative w-full border border-neutral-200 bg-white text-[#0A0A0A] overflow-hidden"
    >
      {/* Top Editorial Lookbook Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-neutral-200 bg-[#FAFAFA] text-[10px] uppercase tracking-[0.18em]">
        <div className="font-semibold text-[#0A0A0A]">
          INDONESIAN LOCAL PRIDE ARCHIVE — 5 CURATED BRAND TENANTS
        </div>

        <div className="inline-flex items-center border border-neutral-300 bg-white">
          <button
            type="button"
            onClick={() => setVisualMode("studio3d")}
            className={`px-3 py-1 font-semibold uppercase tracking-[0.14em] transition-colors ${
              visualMode === "studio3d"
                ? "bg-[#0A0A0A] text-white"
                : "text-neutral-600 hover:text-[#0A0A0A]"
            }`}
          >
            Ilustrasi Siluet 3D
          </button>
          <button
            type="button"
            onClick={() => setVisualMode("unsplash")}
            className={`px-3 py-1 font-semibold uppercase tracking-[0.14em] transition-colors ${
              visualMode === "unsplash"
                ? "bg-[#0A0A0A] text-white"
                : "text-neutral-600 hover:text-[#0A0A0A]"
            }`}
          >
            Fotografi Katalog
          </button>
        </div>
      </div>

      <ClothingRailHero
        items={itemsForRail}
        hanger="wood"
        eyebrow="KURASI LOCAL PRIDE INDONESIA · BANDUNG · SOLO · JAKARTA · YOGYAKARTA"
        heading="Karya Terbaik Brand Lokal, Satu Rak Kurasi."
        caption="Arahkan kursor sepanjang rak untuk memutar gantungan pakaian dari StreetCult, Batik Kencana, Cotton & Sage, Footstep, hingga Hijabika Modest."
        autoplay={autoplay}
        labels={{
          front: "Tampak Depan",
          back: "Tampak Belakang",
          close: "Tutup",
          show: "Inspeksi",
        }}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/product/oversized-heavyweight-boxy-hoodie-washed-charcoal"
              className="inline-flex items-center gap-2 bg-[#185B37] hover:bg-[#0A0A0A] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors"
            >
              Eksplorasi Koleksi Utama
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="#katalog-produk"
              className="inline-flex items-center gap-2 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] transition-colors"
            >
              Lihat Katalog 5 Toko Lokal
            </a>
          </div>
        }
      />
    </div>
  );
}
