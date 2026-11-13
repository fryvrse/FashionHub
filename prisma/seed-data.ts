export type RoleType = "SUPERADMIN" | "STORE_ADMIN" | "USER";
export type StoreStatusType = "PENDING" | "ACTIVE" | "SUSPENDED";
export type PaymentStatusType = "PENDING" | "PAID" | "FAILED";
export type OrderStatusType = "NEW" | "PACKING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type WithdrawalStatusType = "PENDING" | "APPROVED" | "REJECTED";

export interface SeedWithdrawal {
  id: string;
  storeId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: WithdrawalStatusType;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface PromoBannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
}

export interface MarketingConfig {
  heroEyebrow: string;
  heroHeading: string;
  heroCaption: string;
  flashSaleTitle: string;
  flashSaleBadge: string;
  flashSaleDurationSeconds: number;
  flashSaleMaxDiscountText: string;
  flashSaleActive: boolean;
  commissionRatePercent: number;
  promoBanners: PromoBannerItem[];
  updatedAt: string;
}

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  avatar: string;
  createdAt: string;
}

export interface SeedStore {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  city: string;
  status: StoreStatusType;
  isOfficialStore: boolean;
  balance: number;
  bannerUrl?: string;
  description?: string;
  createdAt: string;
}

export interface SeedVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
}

export interface SeedProduct {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  discountPrice: number | null;
  material?: string;
  description?: string;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
  variants: SeedVariant[];
}

export interface TrackingLogEntry {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  location: string;
  hubName: string;
  checkpointIndex: number; // 0=NEW, 1=PACKING, 2=ORIGIN_HUB, 3=DESTINATION_HUB, 4=OUT_FOR_DELIVERY, 5=DELIVERED
}

export interface BuyerShippingAddress {
  recipientName: string;
  phone: string;
  label: string;
  addressLine: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

export const DEFAULT_BUYER_ADDRESS: BuyerShippingAddress = {
  recipientName: "Budi Santoso",
  phone: "+62 812-8890-4412",
  label: "Rumah Utama • Kebayoran Baru",
  addressLine: "Jl. Senopati Dalam No. 42, RT 04/RW 02, Kel. Senayan",
  district: "Kec. Kebayoran Baru",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12190",
};

export interface SeedOrderItem {
  id: string;
  subOrderId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface SeedSubOrder {
  id: string;
  orderId: string;
  storeId: string;
  subTotal: number;
  shippingCost: number;
  shippingCourier: string;
  trackingNumber?: string;
  trackingStage?: number;
  trackingLogs?: TrackingLogEntry[];
  orderStatus: OrderStatusType;
  createdAt: string;
  items: SeedOrderItem[];
}

export interface SeedOrder {
  id: string;
  buyerId: string;
  totalAmount: number;
  paymentStatus: PaymentStatusType;
  shippingAddress?: BuyerShippingAddress;
  createdAt: string;
  subOrders: SeedSubOrder[];
}

export function generateAutoResi(
  shippingCourier: string,
  subOrderId: string
): string {
  const upper = (shippingCourier || "JNE").toUpperCase();
  const prefix = upper.includes("SICEPAT")
    ? "SCP"
    : upper.includes("J&T") || upper.includes("JNT")
    ? "JNT"
    : upper.includes("GOSEND")
    ? "GSD"
    : upper.includes("ANTERAJA")
    ? "ANT"
    : "JNE";
  // Deterministic 10-digit numeric hash from subOrderId
  let hash = 8829104482;
  for (let i = 0; i < subOrderId.length; i++) {
    hash = (hash * 31 + subOrderId.charCodeAt(i)) % 9000000000;
  }
  const tenDigits = String(1000000000 + Math.abs(hash)).slice(0, 10);
  return `${prefix}${tenDigits}ID`;
}

export function getDefaultTrackingStage(status: OrderStatusType): number {
  switch (status) {
    case "NEW":
      return 0;
    case "PACKING":
      return 1;
    case "SHIPPED":
      return 4; // Defaults to full realistic 4-checkpoint journey (Out for Delivery)
    case "COMPLETED":
      return 5;
    case "CANCELLED":
    default:
      return 0;
  }
}

export function buildTrackingLogsForStage(params: {
  subOrderId: string;
  orderStatus: OrderStatusType;
  shippingCourier: string;
  trackingNumber?: string;
  originCity?: string;
  destCity?: string;
  trackingStage?: number;
}): {
  trackingStage: number;
  trackingNumber: string;
  trackingLogs: TrackingLogEntry[];
} {
  const origin = params.originCity || "Bandung";
  const dest = params.destCity || "Jakarta Selatan";
  const stage =
    typeof params.trackingStage === "number"
      ? params.trackingStage
      : getDefaultTrackingStage(params.orderStatus);

  const courierLabel =
    params.shippingCourier.split("(")[0].trim() || "JNE Reguler";
  const resi =
    params.trackingNumber && params.trackingNumber.trim()
      ? params.trackingNumber.trim()
      : stage >= 1
      ? generateAutoResi(params.shippingCourier, params.subOrderId)
      : "";

  const chronological: TrackingLogEntry[] = [
    {
      id: `${params.subOrderId}-log-0`,
      timestamp: "03 Nov 2026, 14:20 WIB",
      title: "Pembayaran terverifikasi. Menunggu penjual menerima pesanan.",
      description: `Pembayaran Master Order telah terverifikasi di rekening bersama (Escrow) FashionHub dan diteruskan ke penjual di ${origin}.`,
      location: "Jakarta — FashionHub Escrow System",
      hubName: "Escrow Payment Gateway",
      checkpointIndex: 0,
    },
  ];

  if (stage >= 1) {
    chronological.push(
      {
        id: `${params.subOrderId}-log-1a`,
        timestamp: "03 Nov 2026, 15:10 WIB",
        title: `Penjual sedang menyiapkan dan mengemas barang di gudang [${origin}].`,
        description: `Quality Control (QC) varian ukuran & pengemasan segel pelindung telah selesai dilakukan di gudang ${origin}.`,
        location: `${origin} — Gudang Pengemasan Toko`,
        hubName: `Warehouse ${origin}`,
        checkpointIndex: 1,
      },
      {
        id: `${params.subOrderId}-log-1b`,
        timestamp: "03 Nov 2026, 16:25 WIB",
        title: "Manifest pengiriman telah dibuat, menunggu penjemputan kurir.",
        description: `Label pengiriman AWB (${resi || "Auto-AWB"}) telah dicetak pada sistem ${courierLabel}. Menunggu penjemputan kurir ke lokasi toko.`,
        location: `${origin} — Pickup Point Tenant`,
        hubName: `Manifest ${courierLabel}`,
        checkpointIndex: 1,
      }
    );
  }

  if (stage >= 2) {
    chronological.push(
      {
        id: `${params.subOrderId}-log-2a`,
        timestamp: "03 Nov 2026, 18:40 WIB",
        title: `Paket telah diserahkan penjual ke gerai/kurir [${courierLabel}] dengan No. Resi ${resi}`,
        description: `Paket telah dipindai (manifested) oleh petugas ekspedisi ${courierLabel} dan siap diberangkatkan ke fasilitas sortir utama.`,
        location: `${origin} — Gerai Utama ${courierLabel}`,
        hubName: `${origin} Drop Point`,
        checkpointIndex: 2,
      },
      {
        id: `${params.subOrderId}-log-2b`,
        timestamp: "03 Nov 2026, 22:15 WIB",
        title: `Paket diberangkatkan dari Hub Asal [${origin} Sorting Center]`,
        description: `Linehaul darat telah berangkat dari fasilitas ${origin} Sorting Center menuju pusat distribusi regional Jabodetabek.`,
        location: `${origin} — ${origin} Sorting Center`,
        hubName: `${origin} Sorting Center`,
        checkpointIndex: 2,
      }
    );
  }

  if (stage >= 3) {
    chronological.push({
      id: `${params.subOrderId}-log-3`,
      timestamp: "Kemarin, 23:50 WIB",
      title: "Paket telah tiba di Sorting Hub [Jakarta Gateway]",
      description: `Paket telah melewati pemindaian masuk (inbound scan) di fasilitas transit utama Jakarta Gateway dan sedang disortir menuju hub pengantaran ${dest}.`,
      location: "Jakarta — Sorting Hub Jakarta Gateway",
      hubName: "Jakarta Gateway",
      checkpointIndex: 3,
    });
  }

  if (stage >= 4) {
    chronological.push({
      id: `${params.subOrderId}-log-4`,
      timestamp: "Hari ini, 09:42 WIB",
      title: `Paket sedang dibawa kurir menuju alamat tujuan [${dest}] (Out for Delivery - Kurir: Ahmad S.)`,
      description: `Kurir pengantar Ahmad S. (+62 813-2201-9940) sedang dalam perjalanan mengantarkan paket ke alamat Budi Santoso di Jl. Senopati Dalam No. 42, ${dest}.`,
      location: `${dest} — Kebayoran Baru Delivery Hub`,
      hubName: `Out for Delivery (${dest})`,
      checkpointIndex: 4,
    });
  }

  if (stage >= 5) {
    chronological.push({
      id: `${params.subOrderId}-log-5`,
      timestamp: "Hari ini, 11:25 WIB",
      title: `Paket telah diterima oleh [Budi Santoso — Pembeli] di alamat tujuan [${dest}].`,
      description:
        "Bukti pengiriman (Proof of Delivery) telah terkonfirmasi. Status pesanan selesai (COMPLETED) & dana Escrow telah dicairkan ke saldo toko.",
      location: `${dest} — Jl. Senopati Dalam No. 42`,
      hubName: "Terkirim (Pesanan Tiba)",
      checkpointIndex: 5,
    });
  }

  return {
    trackingStage: stage,
    trackingNumber: resi,
    trackingLogs: chronological.reverse(),
  };
}

export const INITIAL_USERS: SeedUser[] = [
  {
    id: "user-superadmin",
    name: "Raka Pratama (Superadmin)",
    email: "superadmin@fashionhub.id",
    role: "SUPERADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "user-store-a",
    name: "Admin StreetCult — Streetwear & Footwear ID",
    email: "admin@streetcult.id",
    role: "STORE_ADMIN",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "user-store-b",
    name: "Admin Batik Kencana — Solo",
    email: "admin@batikkencana.id",
    role: "STORE_ADMIN",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "user-store-c",
    name: "Admin Cotton & Sage — Modern Ethnic & Daily",
    email: "admin@cottonsage.id",
    role: "STORE_ADMIN",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-04T10:00:00.000Z",
  },
  {
    id: "user-store-d",
    name: "Admin Footstep Footwear — Sneakers Lokal",
    email: "admin@footstepfootwear.id",
    role: "STORE_ADMIN",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "user-store-e",
    name: "Admin Hijabika Modest — Yogyakarta",
    email: "admin@hijabikamodest.id",
    role: "STORE_ADMIN",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-06T10:00:00.000Z",
  },
  {
    id: "user-buyer",
    name: "Budi - Buyer",
    email: "budi.santoso@gmail.com",
    role: "USER",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
    createdAt: "2026-10-07T12:00:00.000Z",
  },
];

export const INITIAL_STORES: SeedStore[] = [
  {
    id: "store-a",
    ownerId: "user-store-a",
    name: "StreetCult Official",
    slug: "streetcult-official-bandung",
    city: "Bandung",
    status: "ACTIVE",
    isOfficialStore: true,
    balance: 18450000,
    bannerUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80",
    description:
      "Official Store kurasi Streetwear & Menswear lokal Bandung ala Erigo, Thanksinsomnia, dan Sage. Menghadirkan 20 koleksi Hoodie 330GSM, Heavyweight Basic Tee, Graphic Tee, Biker/Windbreaker Jacket, dan Selvedge Denim 14oz.",
    createdAt: "2026-10-02T09:30:00.000Z",
  },
  {
    id: "store-b",
    ownerId: "user-store-b",
    name: "Batik Kencana Modern",
    slug: "batik-kencana-modern-solo",
    city: "Solo",
    status: "ACTIVE",
    isOfficialStore: true,
    balance: 14250000,
    bannerUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&auto=format&fit=crop&q=80",
    description:
      "Official Store Etnik & Formal asal Kota Solo dengan 20 koleksi Kemeja Batik/Formal Slimfit Pria, Outer Tenun ATBM Wanita, Tunik/Blouse Etnik, serta Celana Kain Formal Tailored.",
    createdAt: "2026-10-03T10:30:00.000Z",
  },
  {
    id: "store-c",
    ownerId: "user-store-c",
    name: "Cotton & Sage Daily",
    slug: "cotton-and-sage-daily-jakarta",
    city: "Jakarta Selatan",
    status: "ACTIVE",
    isOfficialStore: false,
    balance: 11680000,
    bannerUrl:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&auto=format&fit=crop&q=80",
    description:
      "Star Seller Casual & Womenswear Jakarta Selatan ala Cottonink & Minimal. Menyediakan 20 koleksi Kemeja Linen Rami Wanita, Knit Cardigan, Crewneck Sweater, Midi Dress, dan Celana Kulot.",
    createdAt: "2026-10-04T11:30:00.000Z",
  },
  {
    id: "store-d",
    ownerId: "user-store-d",
    name: "Footstep Footwear & Sneakers",
    slug: "footstep-footwear-sneakers-bandung",
    city: "Bandung",
    status: "ACTIVE",
    isOfficialStore: true,
    balance: 15920000,
    bannerUrl:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1400&auto=format&fit=crop&q=80",
    description:
      "Official Store Sepatu & Sneakers Lokal Bandung ala Compass & Ventela. Lengkap dengan 20 koleksi Low-Top Canvas Sneakers, High-Top Vulcanized, Running Sport Shoes, Leather Loafers, dan Boots Kulit.",
    createdAt: "2026-10-05T11:30:00.000Z",
  },
  {
    id: "store-e",
    ownerId: "user-store-e",
    name: "Hijabika Modest",
    slug: "hijabika-modest-yogyakarta",
    city: "Yogyakarta",
    status: "ACTIVE",
    isOfficialStore: false,
    balance: 9840000,
    bannerUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&auto=format&fit=crop&q=80",
    description:
      "Star Seller Modest Wear & Busana Muslimah Yogyakarta dengan 20 koleksi Maxi Dress Abaya Arabian Silk, Long Tunik Katun Toyobo, Modest Outer, Pleated Skirt, dan Pashmina Ceruty Babydoll.",
    createdAt: "2026-10-06T11:30:00.000Z",
  },
];

// ============================================================================
// STRICT VISUAL-TO-PRODUCT PHOTO MAPPING POOL (VERIFIED UNSPLASH PHOTO IDS)
// Every photo ID is mapped strictly to what is visually shown in the photograph.
// ============================================================================
const PHOTO = {
  // Hoodies & Sweatshirts
  HOODIE_CHARCOAL_BACK: "photo-1556821840-3a63f95609a7",
  HOODIE_IVORY_STUDIO: "photo-1578681994506-b8f463449011",
  CREWNECK_OATMEAL_FLAT: "photo-1620799140408-edc6dcb6d633",

  // Basic Plain Tees (Strictly plain tees -> named "Heavyweight Oversized Basic Tee")
  BASIC_TEE_WHITE_MAN: "photo-1521572163474-6864f9cf17ab",
  BASIC_TEE_BLACK_MAN: "photo-1583743814966-8936f5b7be1a",
  BASIC_TEE_STACK_EARTH: "photo-1562157873-818bc0726f68",

  // Graphic / Printed Tees (Strictly printed/graphic tees -> named "Graphic Streetwear Tee")
  GRAPHIC_TEE_BLACK_PRINT: "photo-1503342217505-b0a15ec3261c",
  GRAPHIC_TEE_VINTAGE_ART: "photo-1576566588028-4147f3842f27",
  GRAPHIC_TEE_TYPO_WHITE: "photo-1529374255404-311a2a4f1fd9",

  // Leather Jacket (Strictly leather biker jacket -> named "Vintage Faux Leather Biker Jacket")
  LEATHER_BIKER_JACKET: "photo-1551028719-00167b16eac5",

  // Windbreaker / Coach / Bomber / Denim Jackets
  WINDBREAKER_COACH_TAN: "photo-1591047139829-d91aecb6caea",
  BOMBER_JACKET_OLIVE: "photo-1544923246-77307dd654cb",
  DENIM_TRUCKER_BLUE: "photo-1576995853123-5a10305d93c0",
  DENIM_CHORE_DARK: "photo-1551537482-f2075a1d41f2",

  // Denim Jeans (Strictly denim jeans -> named "Selvedge Raw Denim Jeans 14oz" or "Celana Kulot/Straight Denim Jeans")
  JEANS_RAW_DARK_FLAT: "photo-1624378439575-d8705ad7ae80",
  JEANS_VINTAGE_BLUE: "photo-1542272604-787c3835535d",
  JEANS_SLIM_STRAIGHT: "photo-1604176354204-9268737828e4",
  JEANS_WIDE_HIGHWAIST: "photo-1541099649105-f69ad21f3246",

  // Cargo / Chino / Formal Tailored Pants & Culottes
  CARGO_TACTICAL_DARK: "photo-1517445312882-bc9910d016b7",
  CHINO_KHAKI_PANTS: "photo-1473966968600-fa801b869a1a",
  TAILORED_CULOTTES_PANTS: "photo-1594633312681-425c7b97ccd1",

  // Men's Formal / Motif / Linen / Casual Shirts
  SHIRT_FORMAL_NAVY: "photo-1602810318383-e386cc2a3ccf",
  SHIRT_MOTIF_PATTERN: "photo-1596755094514-f87e34085b2c",
  SHIRT_CUBAN_PRINT: "photo-1589310243389-96a5483213a8",
  SHIRT_PLAID_CASUAL: "photo-1607345366928-199ea26cfe3e",
  SHIRT_LINEN_SKY: "photo-1598033129183-c4f50c736f10",
  SHIRT_LINEN_OLIVE: "photo-1620012253295-c15cc3e65df4",

  // Women's Blouses, Tunics, Knit Cardigans, Dresses, Skirts, Scarves
  BLOUSE_WHITE_POPLIN: "photo-1551163943-3f6a855d1153",
  TUNIK_LONG_IVORY: "photo-1564257631407-4deb1f99d992",
  OUTER_KIMONO_DRAPE: "photo-1539109136881-3be0616acf4b",
  OUTER_ATELIER_RACK: "photo-1490481651871-ab68de25d43d",
  KNIT_CARDIGAN_COZY: "photo-1434389677669-e08b4cac3105",
  KNIT_SWEATER_CABLE: "photo-1576871337622-98d48d1cf531",
  COORD_SET_LOUNGE: "photo-1485230895905-ec40ba36b9bc",
  DRESS_MAXI_ABAYA: "photo-1509631179647-0177331693ae",
  DRESS_MIDI_FLOW: "photo-1515886657613-9f3515b0c78f",
  DRESS_SUMMER_TIER: "photo-1496747611176-843222e1e57c",
  SKIRT_PLEATED_MIDI: "photo-1583496661160-fb5886a0aaaa",
  PASHMINA_SILK_SCARF: "photo-1584917865442-de89df76afd3",

  // Footwear: Canvas Sneakers, High-Tops, Running Shoes, Loafers, Boots
  SNEAKER_CANVAS_MAROON: "photo-1525966222134-fcfa99b8ae77",
  SNEAKER_HIGHTOP_BLACK: "photo-1607522370275-f14206abe5d3",
  SNEAKER_HIGHTOP_COURT: "photo-1600185365483-26d7a4cc7519",
  SNEAKER_LOW_COURT_TAN: "photo-1549298916-b41d501d3772",
  SNEAKER_LOW_WHITE_CLEAN: "photo-1587563871167-1ee9c731aefb",
  SNEAKER_LOW_MINIMAL: "photo-1551107696-a4b0c5a0d9a2",
  SNEAKER_RETRO_PASTEL: "photo-1595950653106-6c9ebd614d3a",
  RUNNING_SHOE_CRIMSON: "photo-1542291026-7eec264c27ff",
  RUNNING_SHOE_COLORBLOCK: "photo-1560769629-975ec94e6a86",
  RUNNING_SHOE_NEON: "photo-1606107557195-0e29a4b5b4aa",
  RUNNING_SHOE_TRAINER: "photo-1600185365926-3a2ce3cdb9eb",
  LOAFER_LEATHER_DARK: "photo-1614252369475-531eba835eb1",
  LOAFER_DERBY_COGNAC: "photo-1533867617858-e7b97e060509",
  BOOT_LEATHER_TAN: "photo-1608256246200-53e635b5b65f",
  BOOT_COMBAT_ESPRESSO: "photo-1520639888713-7851133b1ed0",
};

function buildUniqueUnsplashUrl(photoId: string, sig: number): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80&sig=${sig}`;
}

interface RawProductSpec {
  id: string;
  storeId: string;
  name: string;
  slug?: string;
  category: string;
  basePrice: number;
  discountPrice: number | null;
  material: string;
  description: string;
  primaryPhotoId: string;
  secondaryPhotoId: string;
  isFeatured?: boolean;
  colors: [string, string];
  isFootwear?: boolean;
}

const RAW_100_SPECS: RawProductSpec[] = [
  // ==========================================================================
  // 1. STORE A: StreetCult Official (Bandung) — 20 Produk (prod-1 .. prod-20)
  // ==========================================================================
  {
    id: "prod-1",
    storeId: "store-a",
    name: "Oversized Boxy Hoodie 'Garuda Noir' Cotton Fleece 330GSM - Washed Charcoal",
    slug: "oversized-heavyweight-boxy-hoodie-washed-charcoal",
    category: "Streetwear",
    basePrice: 449000,
    discountPrice: 319000,
    material: "Cotton Fleece 330GSM Heavyweight (Washed Finish)",
    description:
      "Hoodie potongan boxy oversized khas skena streetwear lokal Bandung dengan inspirasi siluet Thanksinsomnia dan Erigo. Menggunakan kain Cotton Fleece 330GSM gramasi tebal yang lembut, tudung kepala dua lapis tanpa tali, dan rib karet padat.",
    primaryPhotoId: PHOTO.HOODIE_CHARCOAL_BACK,
    secondaryPhotoId: PHOTO.HOODIE_IVORY_STUDIO,
    isFeatured: true,
    colors: ["Washed Charcoal", "Bone White"],
  },
  {
    id: "prod-2",
    storeId: "store-a",
    name: "Vintage Faux Leather Biker Jacket 'Rebel Bdg' Moto Edition - Jet Black",
    slug: "vintage-faux-leather-biker-jacket-rebel-bdg",
    category: "Outerwear",
    basePrice: 450000,
    discountPrice: 369000,
    material: "Premium Vegan Faux Leather Matte & Furing Quilting Despo",
    description:
      "Jaket kulit biker bergaya vintage rock-streetwear Bandung dengan kerah lapel asimetris, ritsleting logam YKK heavy-duty, dan lapisan dalam furing despo tahan angin untuk berkendara malam.",
    primaryPhotoId: PHOTO.LEATHER_BIKER_JACKET,
    secondaryPhotoId: PHOTO.WINDBREAKER_COACH_TAN,
    isFeatured: true,
    colors: ["Jet Black", "Vintage Espresso"],
  },
  {
    id: "prod-3",
    storeId: "store-a",
    name: "Heavyweight Oversized Basic Tee 'Essential Boxy' Combed 24s - Pure White",
    slug: "heavyweight-oversized-basic-tee-pure-white",
    category: "Streetwear",
    basePrice: 199000,
    discountPrice: 150000,
    material: "100% Cotton Combed 24s Heavyweight Knitto (205 GSM)",
    description:
      "Kaos polos esensial berpotongan boxy drop-shoulder tanpa grafis untuk tampilan minimalis yang bersih. Menggunakan 100% Cotton Combed 24s Knitto Bandung dengan kerah rib 3cm anti-melar.",
    primaryPhotoId: PHOTO.BASIC_TEE_WHITE_MAN,
    secondaryPhotoId: PHOTO.BASIC_TEE_BLACK_MAN,
    isFeatured: true,
    colors: ["Pure White", "Bone Ivory"],
  },
  {
    id: "prod-4",
    storeId: "store-a",
    name: "Selvedge Raw Denim Jeans 14oz 'Braga Straight Cut' - Deep Indigo",
    slug: "selvedge-raw-denim-jeans-14oz-braga-indigo",
    category: "Denim",
    basePrice: 445000,
    discountPrice: 339000,
    material: "Sanforized Selvedge Raw Denim 14oz Redline",
    description:
      "Celana jeans raw denim 14oz potongan lurus (regular straight) dengan jahitan rantai (chainstitch hem) dan kancing logam kuningan. Menghasilkan efek fading alami sesuai lekuk pemakaian.",
    primaryPhotoId: PHOTO.JEANS_RAW_DARK_FLAT,
    secondaryPhotoId: PHOTO.JEANS_VINTAGE_BLUE,
    isFeatured: true,
    colors: ["Deep Indigo", "Raw Unwashed"],
  },
  {
    id: "prod-5",
    storeId: "store-a",
    name: "Coach Jacket Windbreaker 'Archipelago' Taslan Parachute - Camel Tan",
    slug: "coach-jacket-windbreaker-archipelago-camel-tan",
    category: "Outerwear",
    basePrice: 429000,
    discountPrice: 329000,
    material: "Taslan Parachute Milky Coating Waterproof & Cotton Lining",
    description:
      "Jaket windbreaker kerah lipat bergaya coach jacket dengan bahan Taslan Milky Coating yang menahan cipratan hujan ringan dan hembusan angin, dilengkapi kancing snap logam.",
    primaryPhotoId: PHOTO.WINDBREAKER_COACH_TAN,
    secondaryPhotoId: PHOTO.BOMBER_JACKET_OLIVE,
    isFeatured: false,
    colors: ["Camel Tan", "Olive Drab"],
  },
  {
    id: "prod-6",
    storeId: "store-a",
    name: "Heavyweight Oversized Basic Tee 'Monolith' Cotton Combed 24s - Jet Black",
    slug: "heavyweight-oversized-basic-tee-jet-black",
    category: "Streetwear",
    basePrice: 199000,
    discountPrice: 155000,
    material: "100% Cotton Combed 24s Reactive Dye Jet Black",
    description:
      "Kaos polos hitam pekat (reactive dye) dengan potongan oversized boxy fit yang tegas di bahu. Kain Cotton Combed 24s tebal tidak menerawang dan sejuk dipakai harian.",
    primaryPhotoId: PHOTO.BASIC_TEE_BLACK_MAN,
    secondaryPhotoId: PHOTO.BASIC_TEE_WHITE_MAN,
    isFeatured: false,
    colors: ["Jet Black", "Charcoal Slate"],
  },
  {
    id: "prod-7",
    storeId: "store-a",
    name: "Graphic Streetwear Tee 'Underground Radar' Sablon Plastisol - Black Edition",
    slug: "graphic-streetwear-tee-underground-radar-black",
    category: "Streetwear",
    basePrice: 239000,
    discountPrice: 175000,
    material: "Cotton Combed 24s & Sablon Plastisol High-Density Cure",
    description:
      "Kaos bergambar sablon ilustrasi subkultur musik Bandung di bagian dada dengan teknik cetak Plastisol High-Density yang tajam, elastis, dan tidak retak meski dicuci berulang kali.",
    primaryPhotoId: PHOTO.GRAPHIC_TEE_BLACK_PRINT,
    secondaryPhotoId: PHOTO.GRAPHIC_TEE_VINTAGE_ART,
    isFeatured: true,
    colors: ["Black Print", "Washed Coal"],
  },
  {
    id: "prod-8",
    storeId: "store-a",
    name: "Denim Trucker Jacket 15oz 'Type-III Pasundan' Bio-Wash - Vintage Blue",
    slug: "denim-trucker-jacket-15oz-type-iii-vintage-blue",
    category: "Denim",
    basePrice: 450000,
    discountPrice: 379000,
    material: "100% Cotton Denim 15oz Heavy Bio-Stonewash",
    description:
      "Jaket denim siluet klasik Type-III dengan dua saku dada berkancing dan jahitan bartack di setiap titik tumpu. Warna biru vintage dihasilkan melalui proses pencucian batu apung alami.",
    primaryPhotoId: PHOTO.DENIM_TRUCKER_BLUE,
    secondaryPhotoId: PHOTO.DENIM_CHORE_DARK,
    isFeatured: false,
    colors: ["Vintage Blue", "Light Stonewash"],
  },
  {
    id: "prod-9",
    storeId: "store-a",
    name: "Pullover Hoodie Heavyweight 'Studio Archive' Fleece 330GSM - Bone Ivory",
    slug: "pullover-hoodie-heavyweight-studio-archive-ivory",
    category: "Streetwear",
    basePrice: 439000,
    discountPrice: 315000,
    material: "Cotton Fleece 330GSM Brushed Interior",
    description:
      "Hoodie pullover warna gading (bone ivory) dengan saku kanguru tersembunyi dan potongan bahu turun (drop-shoulder) yang memberikan siluet proporsional.",
    primaryPhotoId: PHOTO.HOODIE_IVORY_STUDIO,
    secondaryPhotoId: PHOTO.HOODIE_CHARCOAL_BACK,
    isFeatured: false,
    colors: ["Bone Ivory", "Oatmeal Grey"],
  },
  {
    id: "prod-10",
    storeId: "store-a",
    name: "Celana Chino Workwear 'Skate Carpenter' Canvas Twill - Khaki Tan",
    slug: "celana-chino-workwear-skate-carpenter-khaki",
    category: "Denim",
    basePrice: 369000,
    discountPrice: 269000,
    material: "Canvas Twill Stretch 12oz Enzyme Washed",
    description:
      "Celana panjang chino longgar yang dirancang untuk aktivitas skateboard dan mobilitas harian. Serat Canvas Twill 12oz dilengkapi sedikit spandeks agar leluasa bergerak.",
    primaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    secondaryPhotoId: PHOTO.CARGO_TACTICAL_DARK,
    isFeatured: false,
    colors: ["Khaki Tan", "Espresso Brown"],
  },
  {
    id: "prod-11",
    storeId: "store-a",
    name: "Graphic Streetwear Tee 'Retro Distortion' Acid Wash 24s - Charcoal",
    slug: "graphic-streetwear-tee-retro-distortion-charcoal",
    category: "Streetwear",
    basePrice: 245000,
    discountPrice: 185000,
    material: "Cotton Combed 24s Acid-Wash & Discharge Screenprint",
    description:
      "Kaos streetwear bergambar tipografi retro dengan teknik sablon cabut warna (discharge ink) yang menyatu langsung ke serat kain sehingga terasa sangat lembut dan bernapas.",
    primaryPhotoId: PHOTO.GRAPHIC_TEE_VINTAGE_ART,
    secondaryPhotoId: PHOTO.GRAPHIC_TEE_TYPO_WHITE,
    isFeatured: false,
    colors: ["Acid Charcoal", "Faded Black"],
  },
  {
    id: "prod-12",
    storeId: "store-a",
    name: "Selvedge Raw Denim Jeans 14oz 'Classic Stonewash' - Mid Indigo",
    slug: "selvedge-raw-denim-jeans-14oz-classic-stonewash",
    category: "Denim",
    basePrice: 435000,
    discountPrice: 325000,
    material: "14oz Denim Indigo Rope-Dyed Non-Stretch",
    description:
      "Celana jeans 5-saku berbahan denim 14oz non-stretch dengan rivet tembaga asli dan patch kulit nabati (vegetable-tanned leather patch) di pinggang belakang.",
    primaryPhotoId: PHOTO.JEANS_VINTAGE_BLUE,
    secondaryPhotoId: PHOTO.JEANS_SLIM_STRAIGHT,
    isFeatured: false,
    colors: ["Mid Indigo", "Vintage Wash"],
  },
  {
    id: "prod-13",
    storeId: "store-a",
    name: "Workwear Denim Chore Jacket 'Indigo Atelier' 14oz - Dark Indigo",
    slug: "workwear-denim-chore-jacket-indigo-atelier",
    category: "Outerwear",
    basePrice: 449000,
    discountPrice: 359000,
    material: "Raw Denim Twill 14oz Triple-Stitch Construction",
    description:
      "Jaket kerja (chore coat) berbahan denim gelap 14oz dengan 4 saku utilitas depan dan jahitan tiga jalur (triple-needle stitch) yang sangat tangguh.",
    primaryPhotoId: PHOTO.DENIM_CHORE_DARK,
    secondaryPhotoId: PHOTO.DENIM_TRUCKER_BLUE,
    isFeatured: false,
    colors: ["Dark Indigo", "Rinse Wash"],
  },
  {
    id: "prod-14",
    storeId: "store-a",
    name: "Heavyweight Oversized Basic Tee '3-Pack Bundle' Combed 24s - Earth Series",
    slug: "heavyweight-oversized-basic-tee-3pack-earth",
    category: "Streetwear",
    basePrice: 420000,
    discountPrice: 319000,
    material: "100% Cotton Combed 24s Knitto (Bundling 3 Pcs)",
    description:
      "Paket hemat 3 potong kaos polos Heavyweight Oversized Basic Tee dalam palet warna bumi (Olive, Terracotta, Sand) berbahan Cotton Combed 24s antibakteri.",
    primaryPhotoId: PHOTO.BASIC_TEE_STACK_EARTH,
    secondaryPhotoId: PHOTO.BASIC_TEE_WHITE_MAN,
    isFeatured: false,
    colors: ["Earth Pack (3 Pcs)", "Monochrome Pack (3 Pcs)"],
  },
  {
    id: "prod-15",
    storeId: "store-a",
    name: "Celana Cargo Tactical 'Night Ops' Multi-Pocket Ripstop - Shadow Black",
    slug: "celana-cargo-tactical-night-ops-ripstop",
    category: "Denim",
    basePrice: 399000,
    discountPrice: 289000,
    material: "Cotton Ripstop Crosshatch Anti-Sobek",
    description:
      "Celana cargo taktis dengan konstruksi tenun silang Ripstop yang tahan gesekan, dilengkapi saku samping berkapasitas besar dan tali pengencang di pergelangan kaki.",
    primaryPhotoId: PHOTO.CARGO_TACTICAL_DARK,
    secondaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    isFeatured: false,
    colors: ["Shadow Black", "Tactical Olive"],
  },
  {
    id: "prod-16",
    storeId: "store-a",
    name: "Graphic Streetwear Tee 'Visual Manifesto' Combed 24s - Broken White",
    slug: "graphic-streetwear-tee-visual-manifesto-white",
    category: "Streetwear",
    basePrice: 229000,
    discountPrice: 169000,
    material: "Cotton Combed 24s & Raster Plastisol Print",
    description:
      "Kaos grafis warna putih gading (broken white) dengan cetakan seni visual tipografi kontemporer karya ilustrator independen Bandung.",
    primaryPhotoId: PHOTO.GRAPHIC_TEE_TYPO_WHITE,
    secondaryPhotoId: PHOTO.GRAPHIC_TEE_BLACK_PRINT,
    isFeatured: false,
    colors: ["Broken White", "Cream Sand"],
  },
  {
    id: "prod-17",
    storeId: "store-a",
    name: "Bomber Windbreaker Jacket 'Dago Flight' Nylon Parachute - Olive Night",
    slug: "bomber-windbreaker-jacket-dago-flight-olive",
    category: "Outerwear",
    basePrice: 449000,
    discountPrice: 345000,
    material: "High-Density Nylon Taslan & Rib Knit Collar",
    description:
      "Jaket bomber windbreaker berbahan Nylon Taslan tahan angin dengan saku ritsleting di lengan kiri dan rib leher rajut elastis yang nyaman.",
    primaryPhotoId: PHOTO.BOMBER_JACKET_OLIVE,
    secondaryPhotoId: PHOTO.WINDBREAKER_COACH_TAN,
    isFeatured: false,
    colors: ["Olive Night", "Stealth Black"],
  },
  {
    id: "prod-18",
    storeId: "store-a",
    name: "Selvedge Raw Denim Jeans 14oz 'Slim Tapered Cut' - Indigo Rinse",
    slug: "selvedge-raw-denim-jeans-14oz-slim-tapered",
    category: "Denim",
    basePrice: 429000,
    discountPrice: 319000,
    material: "14oz Sanforized Denim Twill 3x1 Right-Hand",
    description:
      "Celana jeans potongan slim-tapered yang menyempit rapi dari lutut ke mata kaki, menonjolkan siluet sepatu sneakers lokal dengan sempurna.",
    primaryPhotoId: PHOTO.JEANS_SLIM_STRAIGHT,
    secondaryPhotoId: PHOTO.JEANS_RAW_DARK_FLAT,
    isFeatured: false,
    colors: ["Indigo Rinse", "Dark Navy"],
  },
  {
    id: "prod-19",
    storeId: "store-a",
    name: "Kemeja Flannel Overshirt 'Grunge Tartan' Brushed Cotton - Charcoal Check",
    slug: "kemeja-flannel-overshirt-grunge-tartan",
    category: "Casual Shirt",
    basePrice: 349000,
    discountPrice: 249000,
    material: "Heavy Brushed Cotton Flannel 240GSM",
    description:
      "Kemeja flanel kotak-kotak berbahan katun sikat tebal yang dapat dikenakan sebagai kemeja utama maupun luaran (overshirt) di atas kaos polos.",
    primaryPhotoId: PHOTO.SHIRT_PLAID_CASUAL,
    secondaryPhotoId: PHOTO.SHIRT_MOTIF_PATTERN,
    isFeatured: false,
    colors: ["Charcoal Check", "Forest Tartan"],
  },
  {
    id: "prod-20",
    storeId: "store-a",
    name: "Crewneck Sweatshirt 'Heavyweight Club' Cotton Fleece 320GSM - Oatmeal",
    slug: "crewneck-sweatshirt-heavyweight-club-oatmeal",
    category: "Streetwear",
    basePrice: 389000,
    discountPrice: 279000,
    material: "Cotton Fleece 320GSM Loopback & V-Gusset Neck",
    description:
      "Sweater crewneck kerah bulat dengan detail jahitan segitiga V-gusset klasik di leher dan manset rib tebal yang menjaga kehangatan tubuh.",
    primaryPhotoId: PHOTO.CREWNECK_OATMEAL_FLAT,
    secondaryPhotoId: PHOTO.HOODIE_IVORY_STUDIO,
    isFeatured: false,
    colors: ["Oatmeal Heather", "Ash Grey"],
  },

  // ==========================================================================
  // 2. STORE B: Batik Kencana Modern (Solo) — 20 Produk (prod-21 .. prod-40)
  // ==========================================================================
  {
    id: "prod-21",
    storeId: "store-b",
    name: "Kemeja Batik Slimfit Pria 'Parang Kencana' Katun Primisima Furing - Navy",
    slug: "kemeja-batik-slimfit-pria-parang-kencana",
    category: "Local Pride",
    basePrice: 485000,
    discountPrice: 349000,
    material: "Katun Primisima Sogan Solo & Lapis Furing Hero Adem",
    description:
      "Kemeja batik formal pria lengan panjang berpotongan slim-fit modern dari Laweyan, Solo. Dilapisi Furing Hero katun halus sehingga jatuhnya tegas, tidak kusut, dan tetap sejuk dipakai seharian.",
    primaryPhotoId: PHOTO.SHIRT_FORMAL_NAVY,
    secondaryPhotoId: PHOTO.SHIRT_MOTIF_PATTERN,
    isFeatured: true,
    colors: ["Navy Sogan", "Sogan Klasik"],
  },
  {
    id: "prod-22",
    storeId: "store-b",
    name: "Outer Tenun Modern Wanita 'Nusantara Kimono' Tenun Ikat ATBM - Terracotta",
    slug: "outer-tenun-modern-wanita-nusantara-kimono",
    category: "Outerwear",
    basePrice: 580000,
    discountPrice: 425000,
    material: "Tenun Ikat ATBM (Alat Tenun Bukan Mesin) & Linen Rami",
    description:
      "Cardigan outer kimono wanita yang memadukan kain Tenun Ikat ATBM asli tenunan tangan pengrajin Nusantara dengan kerah list Linen Rami yang elegan.",
    primaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: true,
    colors: ["Terracotta Ikat", "Onyx Charcoal"],
  },
  {
    id: "prod-23",
    storeId: "store-b",
    name: "Kemeja Motif Etnik Pria 'Sriwedari' Katun Sogan Lengan Panjang - Sogan",
    slug: "kemeja-motif-etnik-pria-sriwedari-sogan",
    category: "Local Pride",
    basePrice: 450000,
    discountPrice: 329000,
    material: "Katun Berkolissima Halus Cap Malam Tulis",
    description:
      "Kemeja pria bermotif geometris etnik Solo dengan pewarnaan sogan klasik yang berwibawa untuk acara resmi, rapat eksekutif, maupun resepsi pernikahan.",
    primaryPhotoId: PHOTO.SHIRT_MOTIF_PATTERN,
    secondaryPhotoId: PHOTO.SHIRT_FORMAL_NAVY,
    isFeatured: true,
    colors: ["Coklat Sogan", "Hitam Manis"],
  },
  {
    id: "prod-24",
    storeId: "store-b",
    name: "Celana Kain Formal Pria 'Keraton Tailored' Semi-Wool Pleated - Charcoal",
    slug: "celana-kain-formal-pria-keraton-tailored",
    category: "Local Pride",
    basePrice: 420000,
    discountPrice: 310000,
    material: "Semi-Wool Twist Tailored & Pinggang Side-Adjuster",
    description:
      "Celana panjang kain formal dengan lipit depan (single pleat) yang dirancang khusus sebagai pasangan kemeja batik maupun jas kerja.",
    primaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    secondaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    isFeatured: false,
    colors: ["Charcoal Grey", "Jet Black"],
  },
  {
    id: "prod-25",
    storeId: "store-b",
    name: "Kemeja Motif Kontemporer 'Bengawan Resort' Cuban Collar - Ivory Print",
    slug: "kemeja-motif-kontemporer-bengawan-resort",
    category: "Casual Shirt",
    basePrice: 365000,
    discountPrice: 259000,
    material: "Katun Rayon Viscose Dingin & Kancing Kayu Jati",
    description:
      "Kemeja lengan pendek kerah terbuka (Cuban collar) dengan motif wastra kontemporer yang santai namun tetap rapi untuk acara kasual akhir pekan.",
    primaryPhotoId: PHOTO.SHIRT_CUBAN_PRINT,
    secondaryPhotoId: PHOTO.SHIRT_MOTIF_PATTERN,
    isFeatured: false,
    colors: ["Ivory Print", "Navy Tropis"],
  },
  {
    id: "prod-26",
    storeId: "store-b",
    name: "Tunik Blouse Etnik Wanita 'Sekar Laweyan' Viscose Lengan Manset - Ivory",
    slug: "tunik-blouse-etnik-wanita-sekar-laweyan",
    category: "Local Pride",
    basePrice: 440000,
    discountPrice: 319000,
    material: "Viscose Dobby Tenun & Furing Katun Voile",
    description:
      "Blouse tunik wanita berpotongan sopan dengan detail kancing bungkus di bagian depan dan manset lengan wudhu-friendly untuk tampilan kerja berkelas.",
    primaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    secondaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    isFeatured: false,
    colors: ["Ivory Pearl", "Champagne"],
  },
  {
    id: "prod-27",
    storeId: "store-b",
    name: "Kemeja Formal Pria 'Mangkunegaran' Katun Oxford Kerah Tegak - Sky Blue",
    slug: "kemeja-formal-pria-mangkunegaran-oxford",
    category: "Casual Shirt",
    basePrice: 380000,
    discountPrice: 275000,
    material: "Katun Oxford Jepang & Aksen Batik Dalam Kerah",
    description:
      "Kemeja formal lengan panjang berbahan Katun Oxford sejuk dengan sentuhan aksen batik sogan tersembunyi di balik kerah dan manset pergelangan tangan.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    secondaryPhotoId: PHOTO.SHIRT_FORMAL_NAVY,
    isFeatured: false,
    colors: ["Sky Blue", "Pure White"],
  },
  {
    id: "prod-28",
    storeId: "store-b",
    name: "Outer Tenun Wanita 'Lombok Heritage' Loose Cardigan - Natural Sand",
    slug: "outer-tenun-wanita-lombok-heritage-sand",
    category: "Outerwear",
    basePrice: 540000,
    discountPrice: 395000,
    material: "Tenun Tangan Katun Organik & List Linen",
    description:
      "Luaran (outerwear) wanita tanpa kancing dengan potongan jatuh simetris yang menonjolkan keindahan tekstur benang tenun tradisional Indonesia.",
    primaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    secondaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    isFeatured: false,
    colors: ["Natural Sand", "Terracotta"],
  },
  {
    id: "prod-29",
    storeId: "store-b",
    name: "Dress Batik Modern Wanita 'Sekar Jagad' Viscose Silk Midi - Emerald",
    slug: "dress-batik-modern-wanita-sekar-jagad",
    category: "Local Pride",
    basePrice: 560000,
    discountPrice: 415000,
    material: "Viscose Semi-Sutera Cap Tulis & Furing Katun Jepang",
    description:
      "Midi dress batik kontemporer dengan aksen lipit pinggang yang memberikan siluet ramping dan anggun untuk acara kondangan maupun perjamuan resmi.",
    primaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    secondaryPhotoId: PHOTO.DRESS_SUMMER_TIER,
    isFeatured: false,
    colors: ["Emerald Sogan", "Champagne Gold"],
  },
  {
    id: "prod-30",
    storeId: "store-b",
    name: "Kemeja Kasual Pria 'Solo Heritage' Linen Rami Kerah Shanghai - Olive",
    slug: "kemeja-kasual-pria-solo-heritage-shanghai",
    category: "Casual Shirt",
    basePrice: 375000,
    discountPrice: 269000,
    material: "Linen Rami Premium Kombinasi List Tenun",
    description:
      "Kemeja pria kerah tegak (Mandarin/Shanghai collar) berbahan Linen Rami yang sejuk dengan sisipan motif tenun tipis di sepanjang plaket kancing dada.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_OLIVE,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    isFeatured: false,
    colors: ["Olive Green", "Oatmeal Beige"],
  },
  {
    id: "prod-31",
    storeId: "store-b",
    name: "Blouse Kerja Wanita 'Puteri Keraton' Katun Poplin Lipit Dada - White",
    slug: "blouse-kerja-wanita-puteri-keraton-poplin",
    category: "Local Pride",
    basePrice: 350000,
    discountPrice: 249000,
    material: "Cotton Poplin Combed & Kancing Mutiara",
    description:
      "Blouse formal wanita berpotongan rapi dengan detail lipit vertikal halus di bagian dada yang mudah dipadukan dengan rok batik maupun celana kerja.",
    primaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    secondaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    isFeatured: false,
    colors: ["Pure White", "Soft Cream"],
  },
  {
    id: "prod-32",
    storeId: "store-b",
    name: "Celana Kain Formal Pria 'Eksekutif Ankle' Cotton Twill - Sand Khaki",
    slug: "celana-kain-formal-pria-eksekutif-ankle-khaki",
    category: "Local Pride",
    basePrice: 395000,
    discountPrice: 289000,
    material: "Cotton Twill Sueded Stretch",
    description:
      "Celana panjang formal pria berpotongan slim-ankle yang nyaman dipakai duduk bekerja seharian berkat tenunan katun twill halus berdaya regang.",
    primaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    secondaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    isFeatured: false,
    colors: ["Sand Khaki", "Dark Navy"],
  },
  {
    id: "prod-33",
    storeId: "store-b",
    name: "Outer Coat Tenun Wanita 'Kencana Tailored' Kerah Jas - Camel Earth",
    slug: "outer-coat-tenun-wanita-kencana-tailored",
    category: "Outerwear",
    basePrice: 590000,
    discountPrice: 449000,
    material: "Tenun Lurik ATBM & Lapis Furing Satin",
    description:
      "Blazer coat wanita berpotongan struktural yang menggabungkan keanggunan jas formal dengan kekayaan tekstur tenun lurik khas Jawa Tengah.",
    primaryPhotoId: PHOTO.WINDBREAKER_COACH_TAN,
    secondaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    isFeatured: false,
    colors: ["Camel Earth", "Charcoal Lurik"],
  },
  {
    id: "prod-34",
    storeId: "store-b",
    name: "Dress Batik Pesta 'Surya Kencana' A-Line Midi Cut - Terracotta",
    slug: "dress-batik-pesta-surya-kencana-terracotta",
    category: "Local Pride",
    basePrice: 540000,
    discountPrice: 399000,
    material: "Katun Sutra Dobby & Ritsleting Jepang Belakang",
    description:
      "Gaun batik midi berpotongan A-line dengan tekstur benang timbul (dobby) yang memancarkan kesan mewah namun tetap ringan di badan.",
    primaryPhotoId: PHOTO.DRESS_SUMMER_TIER,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Terracotta", "Maroon Sogan"],
  },
  {
    id: "prod-35",
    storeId: "store-b",
    name: "Kemeja Pria Lengan Panjang 'Bale Kambang' Tenun Ikat - Slate Blue",
    slug: "kemeja-pria-lengan-panjang-bale-kambang",
    category: "Casual Shirt",
    basePrice: 465000,
    discountPrice: 339000,
    material: "Tenun Ikat Katun Mercized Halus",
    description:
      "Kemeja pria lengan panjang dengan motif ikat salur vertikal yang memberi efek tubuh lebih tegap dan proporsional.",
    primaryPhotoId: PHOTO.SHIRT_PLAID_CASUAL,
    secondaryPhotoId: PHOTO.SHIRT_FORMAL_NAVY,
    isFeatured: false,
    colors: ["Slate Blue", "Burgundy Ikat"],
  },
  {
    id: "prod-36",
    storeId: "store-b",
    name: "Setelan Wanita Etnik 'Astana Co-Ord' Blouse & Kulot Tenun - Warm Oat",
    slug: "setelan-wanita-etnik-astana-coord-oat",
    category: "Local Pride",
    basePrice: 595000,
    discountPrice: 445000,
    material: "Linen Rami Kombinasi Tenun Lurik Solo",
    description:
      "Setelan dua potong wanita (atasan dan celana kulot lebar) dengan perpaduan warna netral hangat dan aksen lurik klasik.",
    primaryPhotoId: PHOTO.COORD_SET_LOUNGE,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: false,
    colors: ["Warm Oat", "Earth Brown"],
  },
  {
    id: "prod-37",
    storeId: "store-b",
    name: "Maxi Outer Gamis Etnik 'Prameswari' Sifon Silk & Tenun - Onyx Black",
    slug: "maxi-outer-gamis-etnik-prameswari-onyx",
    category: "Outerwear",
    basePrice: 580000,
    discountPrice: 435000,
    material: "Arabian Silk Jetblack & List Tenun Emas",
    description:
      "Long outer menjuntai hingga mata kaki dengan siluet megah dan sentuhan bordir/tenun Nusantara di sepanjang belahan depan.",
    primaryPhotoId: PHOTO.DRESS_MAXI_ABAYA,
    secondaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    isFeatured: false,
    colors: ["Onyx Black", "Deep Emerald"],
  },
  {
    id: "prod-38",
    storeId: "store-b",
    name: "Kemeja Batik Eksekutif 'Lawu Heritage' Katun Primisima - Indigo",
    slug: "kemeja-batik-eksekutif-lawu-heritage-indigo",
    category: "Local Pride",
    basePrice: 495000,
    discountPrice: 359000,
    material: "Katun Primisima Cap Tulis & Furing Katun",
    description:
      "Kemeja batik kelas eksekutif dengan proses pembatikan cap kombinasi tulis tangan yang menghasilkan detail motif presisi di bagian kerah dan saku.",
    primaryPhotoId: PHOTO.SHIRT_FORMAL_NAVY,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    isFeatured: false,
    colors: ["Indigo Malam", "Sogan Solo"],
  },
  {
    id: "prod-39",
    storeId: "store-b",
    name: "Rok Lipit Batik Modern 'Wiru Plisket' Midi Skirt - Mocca Sogan",
    slug: "rok-lipit-batik-modern-wiru-plisket",
    category: "Local Pride",
    basePrice: 360000,
    discountPrice: 255000,
    material: "Semi-Sutera Plisket Permanen Pinggang Karet",
    description:
      "Rok midi lipit (pleated skirt) modern yang terinspirasi dari lipatan wiru kain jarik tradisional, praktis langsung dipakai tanpa perlu dililit.",
    primaryPhotoId: PHOTO.SKIRT_PLEATED_MIDI,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Mocca Sogan", "Hitam Klasik"],
  },
  {
    id: "prod-40",
    storeId: "store-b",
    name: "Selendang Scarf Batik Sutra 'Kencana Shawl' 200x70cm - Champagne",
    slug: "selendang-scarf-batik-sutra-kencana-shawl",
    category: "Local Pride",
    basePrice: 320000,
    discountPrice: 225000,
    material: "Sutera Viscose Jacquard Halus",
    description:
      "Selendang bahu (shawl/scarf) bermotif batik klasik dengan tekstur benang jacquard berkilau lembut untuk melengkapi busana kebaya maupun blazer kerja.",
    primaryPhotoId: PHOTO.PASHMINA_SILK_SCARF,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: false,
    colors: ["Champagne Silk", "Rose Sogan"],
  },

  // ==========================================================================
  // 3. STORE C: Cotton & Sage Daily (Jakarta Selatan) — 20 Produk (prod-41 .. prod-60)
  // ==========================================================================
  {
    id: "prod-41",
    storeId: "store-c",
    name: "Kemeja Linen Oversized Wanita 'Botanica' Linen Rami Premium - Sky Blue",
    slug: "kemeja-linen-oversized-botanica-linen-rami",
    category: "Casual Shirt",
    basePrice: 349000,
    discountPrice: 249000,
    material: "100% Linen Rami Premium Organik (Soft Washed)",
    description:
      "Kemeja kasual harian berpotongan relaxed-oversized ala Cottonink dan Minimal. Dibuat dari 100% serat Linen Rami Premium yang sejuk, menyerap keringat, dan dilengkapi kancing kulit kerang.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_OLIVE,
    isFeatured: true,
    colors: ["Sky Blue", "Sage Green"],
  },
  {
    id: "prod-42",
    storeId: "store-c",
    name: "Knit Cardigan Wanita 'Kemang Cozy' Soft Cotton Rajut Kancing - Oatmeal",
    slug: "knit-cardigan-wanita-kemang-cozy-oatmeal",
    category: "Outerwear",
    basePrice: 389000,
    discountPrice: 279000,
    material: "100% Combed Cotton Knit 7-Gauge (Tidak Gatal di Kulit)",
    description:
      "Cardigan rajut kancing depan dengan tekstur benang katun murni yang lembut dan hangat dipakai di ruangan ber-AC maupun perjalanan sore.",
    primaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    secondaryPhotoId: PHOTO.KNIT_SWEATER_CABLE,
    isFeatured: true,
    colors: ["Oatmeal Cream", "Warm Taupe"],
  },
  {
    id: "prod-43",
    storeId: "store-c",
    name: "Blouse Polos Wanita 'Minimalist Muse' Cotton Poplin Pleated - Pure Ivory",
    slug: "blouse-polos-wanita-minimalist-muse-poplin",
    category: "Casual Shirt",
    basePrice: 299000,
    discountPrice: 215000,
    material: "Cotton Poplin Combed Jepang (Crisp & Breathable)",
    description:
      "Blouse kerja dan harian dengan detail lipit halus dan siluet bersih yang menjaga penampilan tetap rapi dari pagi hingga malam.",
    primaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    secondaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    isFeatured: true,
    colors: ["Pure Ivory", "Powder Blue"],
  },
  {
    id: "prod-44",
    storeId: "store-c",
    name: "Celana Culottes Highwaist 'Senopati Wide-Leg' Linen Rami - Sand Beige",
    slug: "celana-culottes-highwaist-senopati-wide-leg",
    category: "Casual Shirt",
    basePrice: 379000,
    discountPrice: 269000,
    material: "Linen Rami Heavy-Drape Non-Sheer",
    description:
      "Celana kulot berpotongan lebar (wide-leg) dengan pinggang tinggi yang memberikan efek kaki jenjang serta karet belakang elastis yang nyaman.",
    primaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    secondaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    isFeatured: false,
    colors: ["Sand Beige", "Espresso Earth"],
  },
  {
    id: "prod-45",
    storeId: "store-c",
    name: "Crewneck Knit Sweater 'Daily Warmth' Rajut Katun Halus - Cream Ivory",
    slug: "crewneck-knit-sweater-daily-warmth-ivory",
    category: "Outerwear",
    basePrice: 369000,
    discountPrice: 259000,
    material: "Fine-Knit Cotton Modal Blend 12-Gauge",
    description:
      "Sweater rajut leher bulat (crewneck) bertekstur halus dan ringan yang mudah dipadukan di atas kemeja berkerah maupun dipakai tersendiri.",
    primaryPhotoId: PHOTO.CREWNECK_OATMEAL_FLAT,
    secondaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    isFeatured: false,
    colors: ["Cream Ivory", "Sage Mist"],
  },
  {
    id: "prod-46",
    storeId: "store-c",
    name: "Midi Dress Linen 'Menteng Resort' A-Line Relaxed Cut - Terracotta",
    slug: "midi-dress-linen-menteng-resort-terracotta",
    category: "Casual Shirt",
    basePrice: 459000,
    discountPrice: 335000,
    material: "Linen Rayon Blend Breathable & Saku Samping",
    description:
      "Terusan midi dress berpotongan A-line santai dengan saku tersembunyi di kanan-kiri, cocok untuk gaya akhir pekan yang chic dan praktis.",
    primaryPhotoId: PHOTO.DRESS_SUMMER_TIER,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Terracotta", "Oatmeal Linen"],
  },
  {
    id: "prod-47",
    storeId: "store-c",
    name: "Kemeja Linen Relaxed 'Cipete Daily' Lengan Panjang - Olive Sage",
    slug: "kemeja-linen-relaxed-cipete-daily-olive",
    category: "Casual Shirt",
    basePrice: 345000,
    discountPrice: 245000,
    material: "100% Pure Linen Rami Washed",
    description:
      "Kemeja lengan panjang berwarna hijau sage alami yang semakin lembut setiap kali dicuci, menjadi andalan kapsul lemari pakaian minimalis.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_OLIVE,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    isFeatured: false,
    colors: ["Olive Sage", "Natural Sand"],
  },
  {
    id: "prod-48",
    storeId: "store-c",
    name: "Setelan Linen Rami Wanita 'Senopati Co-Ord' Atasan & Kulot - Warm Sand",
    slug: "setelan-linen-rami-wanita-senopati-coord",
    category: "Casual Shirt",
    basePrice: 560000,
    discountPrice: 419000,
    material: "Linen Rami Premium Heavy-Drape (Tidak Menerawang)",
    description:
      "Setelan dua potong (one-set co-ord) terdiri dari atasan minimalis dan celana kulot wide-leg yang langsung siap pakai tanpa bingung memadukan warna.",
    primaryPhotoId: PHOTO.COORD_SET_LOUNGE,
    secondaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    isFeatured: true,
    colors: ["Warm Sand", "Espresso Earth"],
  },
  {
    id: "prod-49",
    storeId: "store-c",
    name: "Celana Kulot Jeans Wanita 'Jakarta Daily' Wide-Leg Denim 12oz - Light Blue",
    slug: "celana-denim-wide-leg-jakarta-daily-12oz",
    category: "Denim",
    basePrice: 439000,
    discountPrice: 325000,
    material: "Denim Katun 12oz Soft Bio-Wash",
    description:
      "Celana jeans potongan kulot lebar (wide-leg highwaist) yang telah melalui pencucian Bio-Wash sehingga kain denim terasa lembut dan jatuh mengikuti langkah.",
    primaryPhotoId: PHOTO.JEANS_WIDE_HIGHWAIST,
    secondaryPhotoId: PHOTO.JEANS_VINTAGE_BLUE,
    isFeatured: false,
    colors: ["Light Vintage Blue", "Mid Indigo"],
  },
  {
    id: "prod-50",
    storeId: "store-c",
    name: "Knit Cardigan Cable 'Autumn Breeze' Rajut Tebal Hangat - Caramel",
    slug: "knit-cardigan-cable-autumn-breeze-caramel",
    category: "Outerwear",
    basePrice: 410000,
    discountPrice: 295000,
    material: "Soft Acrylic Cotton Cable-Knit",
    description:
      "Cardigan rajut bermotif kepang (cable-knit) dengan siluet boxy yang manis dipadukan bersama kaos polos maupun kemeja linen.",
    primaryPhotoId: PHOTO.KNIT_SWEATER_CABLE,
    secondaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    isFeatured: false,
    colors: ["Caramel Brown", "Ivory Cream"],
  },
  {
    id: "prod-51",
    storeId: "store-c",
    name: "Blouse Tunik Wanita 'Dharmawangsa' Rayon Twill Lengan Manset - Ivory",
    slug: "blouse-tunik-wanita-dharmawangsa-ivory",
    category: "Casual Shirt",
    basePrice: 315000,
    discountPrice: 229000,
    material: " Organic Rayon Twill Premium",
    description:
      "Blouse panjang berbahan Rayon Twill yang dingin di kulit dan memiliki daya jatuh kain yang anggun untuk aktivitas kantor.",
    primaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    secondaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    isFeatured: false,
    colors: ["Soft Ivory", "Dusty Rose"],
  },
  {
    id: "prod-52",
    storeId: "store-c",
    name: "Midi Dress Lipit 'Sunday Brunch' Viscose Linen Blend - Emerald Green",
    slug: "midi-dress-lipit-sunday-brunch-emerald",
    category: "Casual Shirt",
    basePrice: 480000,
    discountPrice: 349000,
    material: "Viscose Linen Blend Breathable",
    description:
      "Midi dress mengalir dengan potongan pinggang nyaman yang cocok untuk acara makan siang akhir pekan maupun liburan tropis.",
    primaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    secondaryPhotoId: PHOTO.DRESS_SUMMER_TIER,
    isFeatured: false,
    colors: ["Emerald Green", "Navy Blue"],
  },
  {
    id: "prod-53",
    storeId: "store-c",
    name: "Outer Kimono Linen 'SCBD Commuter' Lightweight Drape - Earth Brown",
    slug: "outer-kimono-linen-scbd-commuter-brown",
    category: "Outerwear",
    basePrice: 399000,
    discountPrice: 289000,
    material: "Linen Rami & Cotton Slub Weave",
    description:
      "Luaran ringan berpotongan kimono modern yang praktis dilipat di dalam tas kerja dan langsung memberikan tampilan profesional saat rapat.",
    primaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: false,
    colors: ["Earth Brown", "Oatmeal"],
  },
  {
    id: "prod-54",
    storeId: "store-c",
    name: "Heavyweight Oversized Basic Tee Wanita 'Daily Combed' 24s - Pure White",
    slug: "heavyweight-oversized-basic-tee-wanita-white",
    category: "Casual Shirt",
    basePrice: 210000,
    discountPrice: 155000,
    material: "100% Cotton Combed 24s Soft-Touch",
    description:
      "Kaos polos wanita potongan relaxed-fit yang tidak menerawang, dirancang sebagai lapisan dasar sempurna di bawah cardigan maupun blazer.",
    primaryPhotoId: PHOTO.BASIC_TEE_WHITE_MAN,
    secondaryPhotoId: PHOTO.BASIC_TEE_STACK_EARTH,
    isFeatured: false,
    colors: ["Pure White", "Oatmeal"],
  },
  {
    id: "prod-55",
    storeId: "store-c",
    name: "Selvedge Raw Denim Jeans Wanita 'Straight Cut 13oz' - Classic Blue",
    slug: "selvedge-raw-denim-jeans-wanita-straight-13oz",
    category: "Denim",
    basePrice: 425000,
    discountPrice: 315000,
    material: "13oz Comfort Denim Cotton",
    description:
      "Celana jeans wanita berpotongan lurus klasik (straight-leg) yang merampingkan pinggul dan nyaman dipakai sepanjang hari.",
    primaryPhotoId: PHOTO.JEANS_VINTAGE_BLUE,
    secondaryPhotoId: PHOTO.JEANS_WIDE_HIGHWAIST,
    isFeatured: false,
    colors: ["Classic Blue", "Dark Indigo"],
  },
  {
    id: "prod-56",
    storeId: "store-c",
    name: "Kemeja Resort Wanita 'Tropical Breeze' Cuban Collar - Ivory Print",
    slug: "kemeja-resort-wanita-tropical-breeze-cuban",
    category: "Casual Shirt",
    basePrice: 325000,
    discountPrice: 235000,
    material: "Rayon Linen Resort Weave",
    description:
      "Kemeja kerah terbuka bermotif tropis lembut dengan kancing batok kelapa alami untuk suasana santai maupun bekerja dari kafe.",
    primaryPhotoId: PHOTO.SHIRT_CUBAN_PRINT,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    isFeatured: false,
    colors: ["Ivory Print", "Sage Print"],
  },
  {
    id: "prod-57",
    storeId: "store-c",
    name: "Pleated Midi Skirt 'Satin Flow' Rok Plisket Highwaist - Champagne",
    slug: "pleated-midi-skirt-satin-flow-champagne",
    category: "Casual Shirt",
    basePrice: 340000,
    discountPrice: 245000,
    material: "Matte-Satin Plisket Premium",
    description:
      "Rok plisket panjang selutut bawah (midi) dengan lipatan tajam permanen dan kilau matte-satin yang elegan.",
    primaryPhotoId: PHOTO.SKIRT_PLEATED_MIDI,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Champagne", "Espresso"],
  },
  {
    id: "prod-58",
    storeId: "store-c",
    name: "Outer Cardigan Linen 'Atelier Collection' Open-Front - Natural Beige",
    slug: "outer-cardigan-linen-atelier-collection-beige",
    category: "Outerwear",
    basePrice: 420000,
    discountPrice: 299000,
    material: "100% Unbleached Natural Linen",
    description:
      "Cardigan linen tanpa kancing dari koleksi studio Jakarta Selatan dengan warna natural tanpa pemutih kimia.",
    primaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    secondaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    isFeatured: false,
    colors: ["Natural Beige", "Warm White"],
  },
  {
    id: "prod-59",
    storeId: "store-c",
    name: "Pullover Hoodie Wanita 'Weekend Lounge' Baby Terry 280GSM - Bone White",
    slug: "pullover-hoodie-wanita-weekend-lounge-white",
    category: "Outerwear",
    basePrice: 390000,
    discountPrice: 279000,
    material: "Combed Baby Terry 280GSM Loopback",
    description:
      "Hoodie santai wanita berbahan Combed Baby Terry yang lebih ringan dari fleece namun tetap lembut dan menyerap keringat di iklim tropis.",
    primaryPhotoId: PHOTO.HOODIE_IVORY_STUDIO,
    secondaryPhotoId: PHOTO.CREWNECK_OATMEAL_FLAT,
    isFeatured: false,
    colors: ["Bone White", "Mist Grey"],
  },
  {
    id: "prod-60",
    storeId: "store-c",
    name: "Celana Chino Wanita Ankle-Cut 'Office Essential' Stretch Twill - Khaki",
    slug: "celana-chino-wanita-ankle-cut-office-khaki",
    category: "Casual Shirt",
    basePrice: 359000,
    discountPrice: 259000,
    material: "Cotton Stretch Twill Peach-Finish",
    description:
      "Celana panjang wanita potongan semata kaki (ankle-cut) dengan permukaan kain peach-finish yang halus untuk tampilan smart-casual.",
    primaryPhotoId: PHOTO.CHINO_KHAKI_PANTS,
    secondaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    isFeatured: false,
    colors: ["Khaki Tan", "Onyx Black"],
  },

  // ==========================================================================
  // 4. STORE D: Footstep Footwear & Sneakers (Bandung) — 20 Produk (prod-61 .. prod-80)
  // ==========================================================================
  {
    id: "prod-61",
    storeId: "store-d",
    name: "Low-Top Canvas Sneakers 'Gazelle Retro' Vulkanisir 12oz - Maroon Cream",
    slug: "sepatu-sneakers-kanvas-lokal-gazelle-retro-low",
    category: "Sneakers Lokal",
    basePrice: 499000,
    discountPrice: 379000,
    material: "Canvas Twill 12oz, Suede Cowhide & Foxing Rubber Vulcanized",
    description:
      "Sneakers vulkanisir lokal kebanggaan Bandung bergaya retro-klasik ala Compass dan Ventela. Menggunakan upper Canvas Twill 12oz, garis samping suede, dan sol karet waffle gum alami.",
    primaryPhotoId: PHOTO.SNEAKER_CANVAS_MAROON,
    secondaryPhotoId: PHOTO.SNEAKER_LOW_COURT_TAN,
    isFeatured: true,
    colors: ["Maroon Cream Gum", "Black Cream Gum"],
    isFootwear: true,
  },
  {
    id: "prod-62",
    storeId: "store-d",
    name: "Running Sport Shoes 'Velocity Pro' Engineered Mesh & Phylon - Crimson Red",
    slug: "running-sport-shoes-velocity-pro-crimson",
    category: "Sneakers Lokal",
    basePrice: 549000,
    discountPrice: 399000,
    material: "Breathable Engineered Mesh & High-Rebound Phylon Midsole",
    description:
      "Sepatu lari lokal berbobot sangat ringan dengan upper jaring sirkulasi udara penuh dan bantalan midsole Phylon yang meredam hentakan lutut.",
    primaryPhotoId: PHOTO.RUNNING_SHOE_CRIMSON,
    secondaryPhotoId: PHOTO.RUNNING_SHOE_COLORBLOCK,
    isFeatured: true,
    colors: ["Crimson Red", "Core Black"],
    isFootwear: true,
  },
  {
    id: "prod-63",
    storeId: "store-d",
    name: "Leather Loafers 'Penny Heritage' Pull-Up Leather Cibaduyut - Dark Espresso",
    slug: "loafers-kulit-asli-penny-heritage-cibaduyut",
    category: "Sneakers Lokal",
    basePrice: 590000,
    discountPrice: 459000,
    material: "100% Full-Grain Pull-Up Cowhide Leather & Blake Stitch Outsole",
    description:
      "Sepatu Penny Loafers buatan tangan pengrajin kulit senior Bandung. Terbuat dari kulit sapi asli Full-Grain Pull-Up dengan konstruksi jahit tembus Blake Stitch.",
    primaryPhotoId: PHOTO.LOAFER_LEATHER_DARK,
    secondaryPhotoId: PHOTO.LOAFER_DERBY_COGNAC,
    isFeatured: true,
    colors: ["Dark Espresso", "Oxblood Burgundy"],
    isFootwear: true,
  },
  {
    id: "prod-64",
    storeId: "store-d",
    name: "High-Top Canvas Sneakers 'Retro 70s Hi' Foxing Gum 12oz - Classic Black",
    slug: "high-top-canvas-sneakers-retro-70s-black",
    category: "Sneakers Lokal",
    basePrice: 529000,
    discountPrice: 389000,
    material: "Canvas 12oz Heavyweight & Autoclaved Vulcanized Sole",
    description:
      "Sepatu sneakers kanvas potongan tinggi (high-top) dengan bumper karet glossy vintage dan insole busa Ultralite yang empuk dipakai konser maupun kuliah.",
    primaryPhotoId: PHOTO.SNEAKER_HIGHTOP_BLACK,
    secondaryPhotoId: PHOTO.SNEAKER_CANVAS_MAROON,
    isFeatured: true,
    colors: ["Classic Black White", "Parchment Cream"],
    isFootwear: true,
  },
  {
    id: "prod-65",
    storeId: "store-d",
    name: "Low-Top Chunky Sneakers 'Cloud Pastel' Suede & Leather - Pastel Multi",
    slug: "low-top-chunky-sneakers-cloud-pastel",
    category: "Sneakers Lokal",
    basePrice: 560000,
    discountPrice: 419000,
    material: "Genuine Suede Panel, Vegan Leather & Cupsole Rubber",
    description:
      "Sneakers kasual berdesain chunky modern dengan perpaduan panel kulit suede lembut dan sol tebal yang menambah tinggi badan 4cm secara proporsional.",
    primaryPhotoId: PHOTO.SNEAKER_RETRO_PASTEL,
    secondaryPhotoId: PHOTO.SNEAKER_LOW_WHITE_CLEAN,
    isFeatured: false,
    colors: ["Pastel Multi", "Cream Ivory"],
    isFootwear: true,
  },
  {
    id: "prod-66",
    storeId: "store-d",
    name: "Leather Ankle Boots 'Worker Rugged' Goodyear Welted - Tan Brown",
    slug: "leather-ankle-boots-worker-rugged-tan",
    category: "Sneakers Lokal",
    basePrice: 650000,
    discountPrice: 499000,
    material: "Crazy Horse Cowhide Leather & Vibram-Style Lug Sole",
    description:
      "Sepatu boots kulit semata kaki bergaya workwear klasik yang tangguh di segala medan, menggunakan kulit sapi Crazy Horse yang tahan goresan.",
    primaryPhotoId: PHOTO.BOOT_LEATHER_TAN,
    secondaryPhotoId: PHOTO.BOOT_COMBAT_ESPRESSO,
    isFeatured: false,
    colors: ["Tan Brown", "Saddle Rust"],
    isFootwear: true,
  },
  {
    id: "prod-67",
    storeId: "store-d",
    name: "Running Sport Sneakers 'Aero Stride' Cushion Runner - Multi Colorblock",
    slug: "running-sport-sneakers-aero-stride-colorblock",
    category: "Sneakers Lokal",
    basePrice: 539000,
    discountPrice: 389000,
    material: "Ripstop Nylon Mesh, Suede Overlay & EVA Midsole",
    description:
      "Sepatu lari dan gaya hidup (lifestyle runner) dengan kombinasi warna retro-sporty dan stabiliser tumit TPU yang kokoh.",
    primaryPhotoId: PHOTO.RUNNING_SHOE_COLORBLOCK,
    secondaryPhotoId: PHOTO.RUNNING_SHOE_TRAINER,
    isFeatured: false,
    colors: ["Multi Colorblock", "Navy Grey"],
    isFootwear: true,
  },
  {
    id: "prod-68",
    storeId: "store-d",
    name: "Leather Derby & Loafers 'Executive Cibaduyut' Handcrafted - Cognac Tan",
    slug: "leather-derby-loafers-executive-cognac",
    category: "Sneakers Lokal",
    basePrice: 599000,
    discountPrice: 449000,
    material: "Hand-Burnished Brush-Off Leather & Leather Lining",
    description:
      "Sepatu kulit formal pria dengan pewarnaan poles tangan (hand-burnished) warna cognac yang elegan untuk setelan kerja maupun batik.",
    primaryPhotoId: PHOTO.LOAFER_DERBY_COGNAC,
    secondaryPhotoId: PHOTO.LOAFER_LEATHER_DARK,
    isFeatured: false,
    colors: ["Cognac Tan", "Dark Mahogany"],
    isFootwear: true,
  },
  {
    id: "prod-69",
    storeId: "store-d",
    name: "Low-Top Court Sneakers 'Minimalist Tennis' Leather - White Tan",
    slug: "low-top-court-sneakers-minimalist-tennis",
    category: "Sneakers Lokal",
    basePrice: 489000,
    discountPrice: 359000,
    material: "Nappa Faux Leather & Stitched Rubber Cupsole",
    description:
      "Sneakers siluet lapangan tenis klasik dengan desain bersih yang serasi dipadukan dengan celana jeans, chino, maupun celana kain formal.",
    primaryPhotoId: PHOTO.SNEAKER_LOW_COURT_TAN,
    secondaryPhotoId: PHOTO.SNEAKER_LOW_MINIMAL,
    isFeatured: false,
    colors: ["White Tan", "All White"],
    isFootwear: true,
  },
  {
    id: "prod-70",
    storeId: "store-d",
    name: "High-Top Basketball Sneakers 'Court Legend' Leather - Red White Black",
    slug: "high-top-basketball-sneakers-court-legend",
    category: "Sneakers Lokal",
    basePrice: 589000,
    discountPrice: 439000,
    material: "Tumbled Action Leather & Padded Ankle Collar",
    description:
      "Sneakers high-top bergaya basket era 80-an dengan kerah pergelangan kaki berbusa tebal dan sol karet jahit keliling penuh.",
    primaryPhotoId: PHOTO.SNEAKER_HIGHTOP_COURT,
    secondaryPhotoId: PHOTO.SNEAKER_HIGHTOP_BLACK,
    isFeatured: false,
    colors: ["Chicago Red Black", "Royal Blue White"],
    isFootwear: true,
  },
  {
    id: "prod-71",
    storeId: "store-d",
    name: "Athletic Running Shoes 'Marathon Nitro' Ultralight Mesh - Neon Volt",
    slug: "athletic-running-shoes-marathon-nitro-volt",
    category: "Sneakers Lokal",
    basePrice: 575000,
    discountPrice: 425000,
    material: "Fly-Mesh Breathable Upper & Nitro-Foam Sole",
    description:
      "Sepatu olahraga lari jarak menengah dan maraton dengan pantulan energi tinggi (high energy return) serta bobot di bawah 230 gram.",
    primaryPhotoId: PHOTO.RUNNING_SHOE_NEON,
    secondaryPhotoId: PHOTO.RUNNING_SHOE_CRIMSON,
    isFeatured: false,
    colors: ["Neon Volt", "Electric Blue"],
    isFootwear: true,
  },
  {
    id: "prod-72",
    storeId: "store-d",
    name: "Leather Ankle Boots 'Parahyangan Trekker' Full-Grain - Dark Espresso",
    slug: "leather-ankle-boots-parahyangan-trekker",
    category: "Sneakers Lokal",
    basePrice: 660000,
    discountPrice: 510000,
    material: "Oil-Tanned Full-Grain Leather & Brass Eyelets",
    description:
      "Boots kulit tangguh buatan Bandung dengan lubang tali kuningan anti-karat dan konstruksi tahan cuaca untuk touring maupun petualangan.",
    primaryPhotoId: PHOTO.BOOT_COMBAT_ESPRESSO,
    secondaryPhotoId: PHOTO.BOOT_LEATHER_TAN,
    isFeatured: false,
    colors: ["Dark Espresso", "Black Matte"],
    isFootwear: true,
  },
  {
    id: "prod-73",
    storeId: "store-d",
    name: "Low-Top Streetwear Sneakers 'Clean Slate' Cupsole - Triple White",
    slug: "low-top-streetwear-sneakers-clean-slate-white",
    category: "Sneakers Lokal",
    basePrice: 479000,
    discountPrice: 349000,
    material: "Easy-Clean Microfiber Leather & Memory Foam Insole",
    description:
      "Sneakers putih bersih esensial dengan permukaan kulit mikrofiber yang mudah dilap bersih dari noda hanya dengan tisu basah.",
    primaryPhotoId: PHOTO.SNEAKER_LOW_WHITE_CLEAN,
    secondaryPhotoId: PHOTO.SNEAKER_LOW_MINIMAL,
    isFeatured: false,
    colors: ["Triple White", "White Grey"],
    isFootwear: true,
  },
  {
    id: "prod-74",
    storeId: "store-d",
    name: "Sport Trainer Sneakers 'Dynamic Cross' Ortholite - Grey Sunset",
    slug: "sport-trainer-sneakers-dynamic-cross-grey",
    category: "Sneakers Lokal",
    basePrice: 530000,
    discountPrice: 385000,
    material: "Multi-Layer Mesh, TPU Cage & Rubber Traction Outsole",
    description:
      "Sepatu latihan gym dan jalan cepat dengan cengkeraman sol anti-selip serta desain ergonomis yang mengunci tumit.",
    primaryPhotoId: PHOTO.RUNNING_SHOE_TRAINER,
    secondaryPhotoId: PHOTO.RUNNING_SHOE_COLORBLOCK,
    isFeatured: false,
    colors: ["Grey Sunset", "Anthracite Black"],
    isFootwear: true,
  },
  {
    id: "prod-75",
    storeId: "store-d",
    name: "Low-Top Canvas Vulcanized 'Venture Skate' Suede Toe - Burgundy Gum",
    slug: "low-top-canvas-vulcanized-venture-skate",
    category: "Sneakers Lokal",
    basePrice: 485000,
    discountPrice: 355000,
    material: "Canvas 12oz, Reinforced Suede Ollie Patch & Gum Sole",
    description:
      "Sepatu skate kanvas lokal yang diperkuat dengan lapisan suede ekstra di bagian depan untuk ketahanan gesek papan skateboard.",
    primaryPhotoId: PHOTO.SNEAKER_CANVAS_MAROON,
    secondaryPhotoId: PHOTO.SNEAKER_HIGHTOP_BLACK,
    isFeatured: false,
    colors: ["Burgundy Gum", "Navy Gum"],
    isFootwear: true,
  },
  {
    id: "prod-76",
    storeId: "store-d",
    name: "Low-Top Casual Sneakers 'Breeze Daily' Canvas Knit - Off-White",
    slug: "low-top-casual-sneakers-breeze-daily-white",
    category: "Sneakers Lokal",
    basePrice: 449000,
    discountPrice: 325000,
    material: "Organic Cotton Canvas & Natural Rubber Sole",
    description:
      "Sneakers kanvas harian berdesain ramping dan ringan untuk menemani mobilitas komuter perkotaan tanpa membuat kaki pegal.",
    primaryPhotoId: PHOTO.SNEAKER_LOW_MINIMAL,
    secondaryPhotoId: PHOTO.SNEAKER_LOW_COURT_TAN,
    isFeatured: false,
    colors: ["Off-White", "Sage Canvas"],
    isFootwear: true,
  },
  {
    id: "prod-77",
    storeId: "store-d",
    name: "Leather Slip-On Loafers 'Artisan Classic' Kulit Sapi - Mahogany",
    slug: "leather-slip-on-loafers-artisan-mahogany",
    category: "Sneakers Lokal",
    basePrice: 580000,
    discountPrice: 439000,
    material: "100% Genuine Cowhide Leather & Cushioned Footbed",
    description:
      "Sepatu slip-on kulit tanpa tali yang praktis dengan bantalan tumit empuk untuk kenyamanan pemakaian formal maupun semi-formal.",
    primaryPhotoId: PHOTO.LOAFER_LEATHER_DARK,
    secondaryPhotoId: PHOTO.LOAFER_DERBY_COGNAC,
    isFeatured: false,
    colors: ["Mahogany Brown", "Jet Black"],
    isFootwear: true,
  },
  {
    id: "prod-78",
    storeId: "store-d",
    name: "High-Top Canvas Vulcanized 'Archipelago Hi' 14oz - Monochrome Black",
    slug: "high-top-canvas-vulcanized-archipelago-hi",
    category: "Sneakers Lokal",
    basePrice: 539000,
    discountPrice: 395000,
    material: "Heavy Canvas 14oz & Double Foxing Tape",
    description:
      "Sneakers high-top kanvas 14oz dengan pita karet foxing ganda yang kokoh dan patch emblem tenun khas Bandung di mata kaki.",
    primaryPhotoId: PHOTO.SNEAKER_HIGHTOP_BLACK,
    secondaryPhotoId: PHOTO.SNEAKER_HIGHTOP_COURT,
    isFeatured: false,
    colors: ["Monochrome Black", "Olive Cream"],
    isFootwear: true,
  },
  {
    id: "prod-79",
    storeId: "store-d",
    name: "Running Track Shoes 'Sprint Nusantara' Ultralight - Scarlet Red",
    slug: "running-track-shoes-sprint-nusantara-red",
    category: "Sneakers Lokal",
    basePrice: 520000,
    discountPrice: 375000,
    material: "Air-Mesh Upper & Dual-Density Phylon",
    description:
      "Sepatu lari harian dengan sirkulasi udara 360 derajat dan sol luar berdaya cengkeram tinggi di aspal basah maupun kering.",
    primaryPhotoId: PHOTO.RUNNING_SHOE_CRIMSON,
    secondaryPhotoId: PHOTO.RUNNING_SHOE_NEON,
    isFeatured: false,
    colors: ["Scarlet Red", "Cobalt Blue"],
    isFootwear: true,
  },
  {
    id: "prod-80",
    storeId: "store-d",
    name: "Leather Lace-Up Boots 'Bandung Heritage' Pull-Up - Chestnut Tan",
    slug: "leather-lace-up-boots-bandung-heritage-tan",
    category: "Sneakers Lokal",
    basePrice: 645000,
    discountPrice: 489000,
    material: "Pull-Up Cowhide Leather & Microtech Cork Sole",
    description:
      "Sepatu boots kulit bertali 6-lubang yang memadukan estetika klasik pengrajin sepatu Bandung dengan sol modern yang ringan.",
    primaryPhotoId: PHOTO.BOOT_LEATHER_TAN,
    secondaryPhotoId: PHOTO.BOOT_COMBAT_ESPRESSO,
    isFeatured: false,
    colors: ["Chestnut Tan", "Dark Brown"],
    isFootwear: true,
  },

  // ==========================================================================
  // 5. STORE E: Hijabika Modest (Yogyakarta) — 20 Produk (prod-81 .. prod-100)
  // ==========================================================================
  {
    id: "prod-81",
    storeId: "store-e",
    name: "Maxi Dress Abaya Modern 'Layla Arabian' Crinkle Silk Ironless - Onyx",
    slug: "dress-abaya-modern-layla-arabian-silk",
    category: "Local Pride",
    basePrice: 575000,
    discountPrice: 435000,
    material: "Arabian Crinkle Silk Premium (Ironless & Tidak Menerawang)",
    description:
      "Abaya modern berpotongan loose A-line yang santun dan anggun karya studio Hijabika Yogyakarta. Bahan Arabian Crinkle Silk jatuh beralun, ironless, serta busui & wudhu-friendly.",
    primaryPhotoId: PHOTO.DRESS_MAXI_ABAYA,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: true,
    colors: ["Onyx Black", "Taupe Rose"],
  },
  {
    id: "prod-82",
    storeId: "store-e",
    name: "Long Tunik Polos Asimetris 'Nabila' Katun Toyobo & Linen Rami - Ivory",
    slug: "tunik-polos-asimetris-nabila-katun-toyobo",
    category: "Casual Shirt",
    basePrice: 329000,
    discountPrice: 239000,
    material: "Katun Toyobo Fodu Original mix Linen Rami",
    description:
      "Tunik panjang menutup pinggul dan lutut dengan potongan bawah asimetris serta kerah shanghai minimalis yang sejuk dipakai seharian.",
    primaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    secondaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    isFeatured: true,
    colors: ["Ivory Cream", "Dusty Olive"],
  },
  {
    id: "prod-83",
    storeId: "store-e",
    name: "Modest Outer Panjang 'Kalyana Kimono' Linen Rami Drape - Terracotta",
    slug: "modest-outer-panjang-kalyana-kimono-terracotta",
    category: "Outerwear",
    basePrice: 410000,
    discountPrice: 295000,
    material: "Linen Rami Slub & Jahitan Tepi Butik",
    description:
      "Luaran panjang muslimah (modest long outer) dengan potongan longgar menutup lekuk tubuh dan saku samping fungsional.",
    primaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: true,
    colors: ["Terracotta Earth", "Warm Sand"],
  },
  {
    id: "prod-84",
    storeId: "store-e",
    name: "Pleated Maxi Skirt 'Zahra Plisket' Hyget Premium Anti-Nerawang - Mocca",
    slug: "pleated-maxi-skirt-zahra-plisket-mocca",
    category: "Local Pride",
    basePrice: 289000,
    discountPrice: 199000,
    material: "Hyget Super Import Gramasi Tebal & Pinggang Full Karet",
    description:
      "Rok plisket panjang semata kaki (maxi skirt) dengan lipatan akordion rapat yang tidak mudah pudar serta bahan tebal tidak menerawang.",
    primaryPhotoId: PHOTO.SKIRT_PLEATED_MIDI,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Mocca Latte", "Onyx Black"],
  },
  {
    id: "prod-85",
    storeId: "store-e",
    name: "Pashmina Scarf 'Armani Silk' Ceruty Babydoll 180x75cm - Rose Champagne",
    slug: "paket-pashmina-ceruty-babydoll-armani-yogyakarta",
    category: "Local Pride",
    basePrice: 210000,
    discountPrice: 155000,
    material: "Ceruty Babydoll Armani Grade A (Jahit Tepi Butik)",
    description:
      "Pashmina ukuran panjang 180x75cm berbahan Ceruty Babydoll Armani bertekstur lembut yang mudah dibentuk mengikuti wajah, lengkap dengan inner rajut.",
    primaryPhotoId: PHOTO.PASHMINA_SILK_SCARF,
    secondaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    isFeatured: true,
    colors: ["Rose Champagne", "Earth Series"],
  },
  {
    id: "prod-86",
    storeId: "store-e",
    name: "Maxi Dress Gamis 'Aisyah Flow' Viscose Rayon Twill Busui - Emerald",
    slug: "maxi-dress-gamis-aisyah-flow-emerald",
    category: "Local Pride",
    basePrice: 495000,
    discountPrice: 365000,
    material: "Viscose Rayon Twill Premium Adem",
    description:
      "Gamis maxi dress berpotongan payung (umbrella cut) yang anggun dengan bukaan ritsleting depan tersembunyi untuk ibu menyusui.",
    primaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    secondaryPhotoId: PHOTO.DRESS_MAXI_ABAYA,
    isFeatured: false,
    colors: ["Emerald Sage", "Deep Navy"],
  },
  {
    id: "prod-87",
    storeId: "store-e",
    name: "Long Tunik Kemeja 'Safiya' Cotton Poplin Oversized Wudhu - Pure White",
    slug: "long-tunik-kemeja-safiya-poplin-white",
    category: "Casual Shirt",
    basePrice: 315000,
    discountPrice: 229000,
    material: "100% Cotton Poplin Jepang Crisp",
    description:
      "Tunik kemeja putih bersih dengan panjang menutup paha, dilengkapi manset berkancing yang memudahkan berwudhu saat beraktivitas.",
    primaryPhotoId: PHOTO.BLOUSE_WHITE_POPLIN,
    secondaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    isFeatured: false,
    colors: ["Pure White", "Sky Blue"],
  },
  {
    id: "prod-88",
    storeId: "store-e",
    name: "Modest Knit Cardigan 'Malioboro Cozy' Rajut Panjang - Oatmeal Cream",
    slug: "modest-knit-cardigan-malioboro-cozy-cream",
    category: "Outerwear",
    basePrice: 375000,
    discountPrice: 269000,
    material: "Soft Combed Cotton Knit 7-Gauge",
    description:
      "Cardigan rajut muslimah berpotongan panjang dan longgar yang tidak membentuk lekuk tubuh, nyaman untuk kuliah maupun perjalanan.",
    primaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    secondaryPhotoId: PHOTO.KNIT_SWEATER_CABLE,
    isFeatured: false,
    colors: ["Oatmeal Cream", "Dusty Cedar"],
  },
  {
    id: "prod-89",
    storeId: "store-e",
    name: "Setelan Muslimah One-Set 'Umi Lounge' Tunik Panjang & Kulot - Warm Oat",
    slug: "setelan-muslimah-oneset-umi-lounge-oat",
    category: "Local Pride",
    basePrice: 520000,
    discountPrice: 389000,
    material: "Linen Crinkle Airflow Ironless",
    description:
      "Setelan muslimah praktis terdiri dari tunik panjang dan celana kulot longgar berbahan Crinkle Airflow yang sejuk dan bebas kusut.",
    primaryPhotoId: PHOTO.COORD_SET_LOUNGE,
    secondaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    isFeatured: false,
    colors: ["Warm Oat", "Sage Green"],
  },
  {
    id: "prod-90",
    storeId: "store-e",
    name: "Maxi Dress Tiered 'Medina Rempel' Katun Bordir Halus - Terracotta",
    slug: "maxi-dress-tiered-medina-rempel-terracotta",
    category: "Local Pride",
    basePrice: 485000,
    discountPrice: 355000,
    material: "Katun Jepang Bordir Eyelet & Full Furing",
    description:
      "Gamis rempel bertingkat (tiered maxi dress) dengan aksen bordir eyelet halus dan lapisan furing katun penuh yang santun.",
    primaryPhotoId: PHOTO.DRESS_SUMMER_TIER,
    secondaryPhotoId: PHOTO.DRESS_MIDI_FLOW,
    isFeatured: false,
    colors: ["Terracotta", "Broken White"],
  },
  {
    id: "prod-91",
    storeId: "store-e",
    name: "Modest Trench Coat 'Yasmin Long Outer' Canvas Twill - Camel Tan",
    slug: "modest-trench-coat-yasmin-long-outer-camel",
    category: "Outerwear",
    basePrice: 490000,
    discountPrice: 369000,
    material: "Soft Canvas Twill & Sabuk Pinggang Lepas-Pasang",
    description:
      "Long outer bergaya trench coat muslimah yang memberikan tampilan formal rapi saat dipadukan dengan hijab polos maupun bermotif.",
    primaryPhotoId: PHOTO.WINDBREAKER_COACH_TAN,
    secondaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    isFeatured: false,
    colors: ["Camel Tan", "Taupe Grey"],
  },
  {
    id: "prod-92",
    storeId: "store-e",
    name: "Celana Kulot Muslimah 'Palazzo Syari' Linen Rami Lebar - Sand Beige",
    slug: "celana-kulot-muslimah-palazzo-syari-sand",
    category: "Casual Shirt",
    basePrice: 339000,
    discountPrice: 245000,
    material: "Linen Rami Heavy-Drape",
    description:
      "Celana kulot palazzo ekstra lebar menyerupai siluet rok yang menjaga keleluasaan melangkah secara syar'i dan sopan.",
    primaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    secondaryPhotoId: PHOTO.SKIRT_PLEATED_MIDI,
    isFeatured: false,
    colors: ["Sand Beige", "Onyx Black"],
  },
  {
    id: "prod-93",
    storeId: "store-e",
    name: "Modest Cardigan & Pashmina Set 'Atelier Jogja' Linen Blend - Natural",
    slug: "modest-cardigan-pashmina-set-atelier-jogja",
    category: "Local Pride",
    basePrice: 445000,
    discountPrice: 329000,
    material: "Linen Cotton Blend & Ceruty Shawl Senada",
    description:
      "Paket luaran modest panjang beserta pashmina warna senada (tone-on-tone) dari studio butik Hijabika Yogyakarta.",
    primaryPhotoId: PHOTO.OUTER_ATELIER_RACK,
    secondaryPhotoId: PHOTO.PASHMINA_SILK_SCARF,
    isFeatured: false,
    colors: ["Natural Sand", "Warm Ivory"],
  },
  {
    id: "prod-94",
    storeId: "store-e",
    name: "Long Tunik Linen 'Khadijah' 100% Linen Rami Kerah Tegak - Sky Blue",
    slug: "long-tunik-linen-khadijah-sky-blue",
    category: "Casual Shirt",
    basePrice: 359000,
    discountPrice: 259000,
    material: "100% Pure Linen Rami Organik",
    description:
      "Tunik kemeja panjang berbahan Linen Rami murni dengan potongan A-line longgar dan saku tersembunyi di kedua sisi.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_SKY,
    secondaryPhotoId: PHOTO.SHIRT_LINEN_OLIVE,
    isFeatured: false,
    colors: ["Sky Blue", "Oatmeal"],
  },
  {
    id: "prod-95",
    storeId: "store-e",
    name: "Modest Crewneck Sweater 'Hana Oversize' Rajut Katun Longgar - Oatmeal",
    slug: "modest-crewneck-sweater-hana-oversize-oatmeal",
    category: "Outerwear",
    basePrice: 355000,
    discountPrice: 255000,
    material: "Cotton Knit 10-Gauge Non-Clingy",
    description:
      "Sweater rajut muslimah dengan panjang menutup pinggul dan potongan lengan balon longgar yang santun serta hangat.",
    primaryPhotoId: PHOTO.CREWNECK_OATMEAL_FLAT,
    secondaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    isFeatured: false,
    colors: ["Oatmeal", "Soft Mocha"],
  },
  {
    id: "prod-96",
    storeId: "store-e",
    name: "Maxi Abaya 'Al-Ifrah' Arabian Jetblack Silk Bordir Tangan - Jet Black",
    slug: "maxi-abaya-al-ifrah-arabian-jetblack",
    category: "Local Pride",
    basePrice: 595000,
    discountPrice: 449000,
    material: "Original Saudi Jetblack Silk & Bordir Benang Halus",
    description:
      "Abaya hitam pekat berbahan Saudi Jetblack Silk yang terkenal sangat sejuk, jatuh beralun, dan dihiasi bordir minimalis di manset lengan.",
    primaryPhotoId: PHOTO.DRESS_MAXI_ABAYA,
    secondaryPhotoId: PHOTO.OUTER_KIMONO_DRAPE,
    isFeatured: false,
    colors: ["Jet Black", "Midnight Navy"],
  },
  {
    id: "prod-97",
    storeId: "store-e",
    name: "Pleated Maxi Skirt 'Salsabila' Rok Plisket Payung Lebar - Latte Brown",
    slug: "pleated-maxi-skirt-salsabila-latte",
    category: "Local Pride",
    basePrice: 295000,
    discountPrice: 209000,
    material: " Sueded Hyget Plisket Premium",
    description:
      "Rok plisket muslimah potongan payung lebar dengan permukaan kain lembut seperti suede dan karet pinggang nyaman.",
    primaryPhotoId: PHOTO.SKIRT_PLEATED_MIDI,
    secondaryPhotoId: PHOTO.TAILORED_CULOTTES_PANTS,
    isFeatured: false,
    colors: ["Latte Brown", "Cream Ivory"],
  },
  {
    id: "prod-98",
    storeId: "store-e",
    name: "Kemeja Tunik Muslimah 'Rania' Linen Blend Lengan Manset - Olive Sage",
    slug: "kemeja-tunik-muslimah-rania-olive-sage",
    category: "Casual Shirt",
    basePrice: 345000,
    discountPrice: 249000,
    material: "Linen Rami & Katun Madinah Halus",
    description:
      "Kemeja tunik harian warna hijau sage dengan kombinasi Katun Madinah yang ringan, menyerap keringat, dan tidak mudah kusut.",
    primaryPhotoId: PHOTO.SHIRT_LINEN_OLIVE,
    secondaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    isFeatured: false,
    colors: ["Olive Sage", "Sand Khaki"],
  },
  {
    id: "prod-99",
    storeId: "store-e",
    name: "Modest Knit Outer 'Maryam Cable' Cardigan Rajut Kancing Kayu - Caramel",
    slug: "modest-knit-outer-maryam-cable-caramel",
    category: "Outerwear",
    basePrice: 395000,
    discountPrice: 285000,
    material: "Chunky Cable-Knit Cotton Blend",
    description:
      "Cardigan rajut kepang berpotongan sopan dengan kancing kayu kelapa besar yang serasi dipadukan bersama rok plisket maupun gamis polos.",
    primaryPhotoId: PHOTO.KNIT_SWEATER_CABLE,
    secondaryPhotoId: PHOTO.KNIT_CARDIGAN_COZY,
    isFeatured: false,
    colors: ["Caramel", "Oatmeal"],
  },
  {
    id: "prod-100",
    storeId: "store-e",
    name: "Hijab Pashmina Silk 'Voal & Ceruty Keraton' Lasercut Exclusive - Silk Rose",
    slug: "hijab-pashmina-silk-keraton-lasercut-rose",
    category: "Local Pride",
    basePrice: 225000,
    discountPrice: 165000,
    material: "Arabian Textured Silk & Tepian Lasercut Presisi",
    description:
      "Hijab pashmina eksklusif dengan kilau lembut khas sutra Arab dan detail tepian lasercut gelombang yang mewah untuk acara spesial.",
    primaryPhotoId: PHOTO.PASHMINA_SILK_SCARF,
    secondaryPhotoId: PHOTO.TUNIK_LONG_IVORY,
    isFeatured: false,
    colors: ["Silk Rose", "Champagne Gold"],
  },
];

export const INITIAL_PRODUCTS: SeedProduct[] = RAW_100_SPECS.map((spec, index) => {
  const num = index + 1;
  const slug =
    spec.slug ||
    `${spec.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${num}`;

  // FULL CARTESIAN MATRIX: every color × every size (apparel S/M/L/XL, footwear 39–44).
  // ID scheme keeps legacy IDs stable for the first color (var-{num*100 + sizeIdx + 1})
  // and offsets subsequent colors by +50 per color (var-{num*100 + 50*colorIdx + sizeIdx + 1}).
  const sizes = spec.isFootwear
    ? ["39", "40", "41", "42", "43", "44"]
    : ["S", "M", "L", "XL"];
  const colors = Array.from(new Set(spec.colors.filter(Boolean)));
  const variants: SeedVariant[] = [];
  colors.forEach((color, cIdx) => {
    sizes.forEach((sz, sIdx) => {
      variants.push({
        id: `var-${num * 100 + cIdx * 50 + sIdx + 1}`,
        productId: spec.id,
        size: sz,
        color,
        // Always 12–35 pcs (never 0)
        stock: 12 + ((num * 7 + cIdx * 11 + sIdx * 5) % 24),
      });
    });
  });

  return {
    id: spec.id,
    storeId: spec.storeId,
    name: spec.name,
    slug,
    category: spec.category,
    basePrice: spec.basePrice,
    discountPrice: spec.discountPrice,
    material: spec.material,
    description: spec.description,
    images: [
      buildUniqueUnsplashUrl(spec.primaryPhotoId, num),
      buildUniqueUnsplashUrl(spec.secondaryPhotoId, num + 1000),
    ],
    isFeatured: Boolean(spec.isFeatured),
    createdAt: new Date(Date.UTC(2026, 9, 10 + (num % 20), 8, num % 60)).toISOString(),
    variants,
  };
});

export const INITIAL_ORDERS: SeedOrder[] = [
  {
    id: "ORD-20261104-810",
    buyerId: "user-buyer",
    totalAmount: 341000,
    paymentStatus: "PAID",
    shippingAddress: DEFAULT_BUYER_ADDRESS,
    createdAt: "2026-11-04T04:16:54.806Z",
    subOrders: [
      {
        id: "SUB-20261104-810-1",
        orderId: "ORD-20261104-810",
        storeId: "store-a",
        subTotal: 319000,
        shippingCost: 22000,
        shippingCourier: "JNE Reguler (2-3 Hari)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261104-810-1",
          orderStatus: "SHIPPED",
          shippingCourier: "JNE Reguler (2-3 Hari)",
          trackingNumber: "JNE8829104482ID",
          originCity: "Bandung",
          destCity: "Jakarta Selatan",
          trackingStage: 4,
        }),
        orderStatus: "SHIPPED",
        createdAt: "2026-11-04T04:16:54.806Z",
        items: [
          {
            id: "ITEM-1793765814807-0-0",
            subOrderId: "SUB-20261104-810-1",
            variantId: "var-103", // prod-1 Oversized Boxy Hoodie L
            quantity: 1,
            price: 319000,
          },
        ],
      },
    ],
  },
  {
    id: "ORD-20261101-001",
    buyerId: "user-buyer",
    totalAmount: 1106000,
    paymentStatus: "PAID",
    shippingAddress: DEFAULT_BUYER_ADDRESS,
    createdAt: "2026-11-01T14:20:00.000Z",
    subOrders: [
      {
        id: "SUB-20261101-A1",
        orderId: "ORD-20261101-001",
        storeId: "store-a",
        subTotal: 688000,
        shippingCost: 22000,
        shippingCourier: "JNE Reguler (2-3 Hari)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261101-A1",
          orderStatus: "SHIPPED",
          shippingCourier: "JNE Reguler (2-3 Hari)",
          trackingNumber: "JNE8840291109ID",
          originCity: "Bandung",
          destCity: "Jakarta Selatan",
          trackingStage: 4,
        }),
        orderStatus: "SHIPPED",
        createdAt: "2026-11-01T14:20:00.000Z",
        items: [
          {
            id: "ITEM-1001",
            subOrderId: "SUB-20261101-A1",
            variantId: "var-102", // prod-1 Oversized Boxy Hoodie M
            quantity: 1,
            price: 319000,
          },
          {
            id: "ITEM-1002",
            subOrderId: "SUB-20261101-A1",
            variantId: "var-202", // prod-2 Vintage Faux Leather Biker Jacket M
            quantity: 1,
            price: 369000,
          },
        ],
      },
      {
        id: "SUB-20261101-B1",
        orderId: "ORD-20261101-001",
        storeId: "store-b",
        subTotal: 370000,
        shippingCost: 26000,
        shippingCourier: "SiCepat BEST Next Day (1-2 Hari)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261101-B1",
          orderStatus: "PACKING",
          shippingCourier: "SiCepat BEST Next Day (1-2 Hari)",
          trackingNumber: "SCP0092841102ID",
          originCity: "Solo",
          destCity: "Jakarta Selatan",
          trackingStage: 1,
        }),
        orderStatus: "PACKING",
        createdAt: "2026-11-01T14:20:00.000Z",
        items: [
          {
            id: "ITEM-1003",
            subOrderId: "SUB-20261101-B1",
            variantId: "var-2103", // prod-21 Kemeja Batik Slimfit Parang Kencana L
            quantity: 1,
            price: 349000,
          },
        ],
      },
    ],
  },
  {
    id: "ORD-20261102-002",
    buyerId: "user-buyer",
    totalAmount: 1120000,
    paymentStatus: "PAID",
    shippingAddress: DEFAULT_BUYER_ADDRESS,
    createdAt: "2026-11-02T16:45:00.000Z",
    subOrders: [
      {
        id: "SUB-20261102-C1",
        orderId: "ORD-20261102-002",
        storeId: "store-c",
        subTotal: 249000,
        shippingCost: 15000,
        shippingCourier: "GoSend Same Day (Jakarta Selatan)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261102-C1",
          orderStatus: "NEW",
          shippingCourier: "GoSend Same Day (Jakarta Selatan)",
          originCity: "Jakarta Selatan",
          destCity: "Jakarta Selatan",
          trackingStage: 0,
        }),
        orderStatus: "NEW",
        createdAt: "2026-11-02T16:45:00.000Z",
        items: [
          {
            id: "ITEM-1004",
            subOrderId: "SUB-20261102-C1",
            variantId: "var-4102", // prod-41 Kemeja Linen Oversized Botanica M
            quantity: 1,
            price: 249000,
          },
        ],
      },
      {
        id: "SUB-20261102-D1",
        orderId: "ORD-20261102-002",
        storeId: "store-d",
        subTotal: 379000,
        shippingCost: 18000,
        shippingCourier: "J&T Express EZ (2-3 Hari)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261102-D1",
          orderStatus: "NEW",
          shippingCourier: "J&T Express EZ (2-3 Hari)",
          originCity: "Bandung",
          destCity: "Jakarta Selatan",
          trackingStage: 0,
        }),
        orderStatus: "NEW",
        createdAt: "2026-11-02T16:45:00.000Z",
        items: [
          {
            id: "ITEM-1005",
            subOrderId: "SUB-20261102-D1",
            variantId: "var-6103", // prod-61 Low-Top Canvas Sneakers Gazelle 41
            quantity: 1,
            price: 379000,
          },
        ],
      },
      {
        id: "SUB-20261102-E1",
        orderId: "ORD-20261102-002",
        storeId: "store-e",
        subTotal: 435000,
        shippingCost: 24000,
        shippingCourier: "JNE Reguler (2-3 Hari)",
        ...buildTrackingLogsForStage({
          subOrderId: "SUB-20261102-E1",
          orderStatus: "NEW",
          shippingCourier: "JNE Reguler (2-3 Hari)",
          originCity: "Yogyakarta",
          destCity: "Jakarta Selatan",
          trackingStage: 0,
        }),
        orderStatus: "NEW",
        createdAt: "2026-11-02T16:45:00.000Z",
        items: [
          {
            id: "ITEM-1006",
            subOrderId: "SUB-20261102-E1",
            variantId: "var-8102", // prod-81 Maxi Dress Abaya Modern Layla M
            quantity: 1,
            price: 435000,
          },
        ],
      },
    ],
  },
];

export const INITIAL_WITHDRAWALS: SeedWithdrawal[] = [
  {
    id: "WD-20261103-01",
    storeId: "store-a",
    amount: 4500000,
    bankName: "BCA Corporate",
    accountNumber: "7780-9123-45",
    accountHolder: "PT StreetCult Kreasi Bandung",
    status: "PENDING",
    requestedAt: "2026-11-03T09:15:00.000Z",
    notes: "Pencairan saldo escrow penjualan kampanye Local Pride November",
  },
  {
    id: "WD-20261103-02",
    storeId: "store-b",
    amount: 3200000,
    bankName: "Bank Mandiri",
    accountNumber: "124-00-9881234-1",
    accountHolder: "CV Batik Kencana Laweyan Solo",
    status: "PENDING",
    requestedAt: "2026-11-03T10:30:00.000Z",
    notes: "Penarikan dana operasional produksi kain tenun ATBM & batik tulis",
  },
  {
    id: "WD-20261028-00",
    storeId: "store-d",
    amount: 2750000,
    bankName: "BNI Bisnis",
    accountNumber: "0889-2311-90",
    accountHolder: "PT Footstep Vulkanisir Nusantara",
    status: "APPROVED",
    requestedAt: "2026-10-28T08:00:00.000Z",
    processedAt: "2026-10-28T11:20:00.000Z",
    notes: "Settlement reguler sepatu kanvas lokal Oktober 2026",
  },
];

export const INITIAL_MARKETING_CONFIG: MarketingConfig = {
  heroEyebrow: "FASHIONHUB ARCHIVE • 100 PRODUK KURASI 5 BRAND LOKAL INDONESIA",
  heroHeading: "Karya Terbaik Brand Lokal, Satu Katalog Terkurasi.",
  heroCaption:
    "100 koleksi terkurasi dari StreetCult Bandung, Batik Kencana Solo, Cotton & Sage Jakarta, Footstep Sneakers, hingga Hijabika Modest Yogyakarta.",
  flashSaleTitle: "Pekan Raya Brand Lokal Indonesia • Diskon s.d 35%",
  flashSaleBadge: "LOCAL PRIDE FLASH SALE",
  flashSaleDurationSeconds: 2 * 3600 + 44 * 60 + 39,
  flashSaleMaxDiscountText: "35%",
  flashSaleActive: true,
  commissionRatePercent: 5,
  promoBanners: [
    {
      id: "banner-1",
      title: "Pekan Raya Local Pride: 100 Koleksi Eksklusif 5 Brand Lokal",
      subtitle: "Kurasi 5 Brand Lokal Terbaik Bandung, Solo, Jakarta & Yogyakarta",
      badge: "INDONESIAN LOCAL PRIDE",
      imageUrl:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80",
      ctaText: "Belanja Local Pride",
      ctaLink: "/?category=Local%20Pride",
      active: true,
    },
    {
      id: "banner-2",
      title: "Koleksi Linen Rami & Modest Wear Musim Tropis",
      subtitle: "Cotton & Sage Daily Jakarta × Hijabika Modest Yogyakarta",
      badge: "DAILY & MODEST EDIT",
      imageUrl:
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&auto=format&fit=crop&q=80",
      ctaText: "Eksplorasi Casual Shirt",
      ctaLink: "/?category=Casual%20Shirt",
      active: true,
    },
  ],
  updatedAt: "2026-11-04T10:55:00.000Z",
};
