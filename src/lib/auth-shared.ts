import { RoleType } from "../../prisma/seed-data";

export const DEMO_SESSION_COOKIE = "fh_demo_session";

export interface DemoAccount {
  id: string;
  key:
    | "superadmin"
    | "store_a"
    | "store_b"
    | "store_c"
    | "store_d"
    | "store_e"
    | "buyer";
  label: string;
  subLabel: string;
  badgeText: string;
  role: RoleType;
  userId: string;
  storeId?: string;
  storeName?: string;
  isOfficialStore?: boolean;
  defaultRedirect: string;
  avatar: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "buyer",
    key: "buyer",
    label: "Budi - Buyer",
    subLabel: "Pembeli Marketplace • Kurasi Local Pride",
    badgeText: "USER (Buyer)",
    role: "USER",
    userId: "user-buyer",
    defaultRedirect: "/",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "store_a",
    key: "store_a",
    label: "Admin StreetCult",
    subLabel: "StreetCult Official • Streetwear & Footwear ID (Bandung)",
    badgeText: "STORE_ADMIN • StreetCult",
    role: "STORE_ADMIN",
    userId: "user-store-a",
    storeId: "store-a",
    storeName: "StreetCult Official (Streetwear & Footwear ID)",
    isOfficialStore: true,
    defaultRedirect: "/seller/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "store_b",
    key: "store_b",
    label: "Admin Batik Kencana",
    subLabel: "Batik Kencana Modern • Etnik & Formal (Solo)",
    badgeText: "STORE_ADMIN • Batik Kencana",
    role: "STORE_ADMIN",
    userId: "user-store-b",
    storeId: "store-b",
    storeName: "Batik Kencana Modern",
    isOfficialStore: true,
    defaultRedirect: "/seller/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "store_c",
    key: "store_c",
    label: "Admin Cotton & Sage",
    subLabel: "Cotton & Sage Daily • Casual & Womenswear (Jakarta)",
    badgeText: "STORE_ADMIN • Cotton & Sage",
    role: "STORE_ADMIN",
    userId: "user-store-c",
    storeId: "store-c",
    storeName: "Cotton & Sage Daily (Modern Ethnic & Daily Wear)",
    isOfficialStore: false,
    defaultRedirect: "/seller/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "store_d",
    key: "store_d",
    label: "Admin Footstep Sneakers",
    subLabel: "Footstep Footwear & Sneakers • Sepatu Lokal (Bandung)",
    badgeText: "STORE_ADMIN • Footstep",
    role: "STORE_ADMIN",
    userId: "user-store-d",
    storeId: "store-d",
    storeName: "Footstep Footwear & Sneakers",
    isOfficialStore: true,
    defaultRedirect: "/seller/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "store_e",
    key: "store_e",
    label: "Admin Hijabika Modest",
    subLabel: "Hijabika Modest • Busana Muslimah (Yogyakarta)",
    badgeText: "STORE_ADMIN • Hijabika",
    role: "STORE_ADMIN",
    userId: "user-store-e",
    storeId: "store-e",
    storeName: "Hijabika Modest",
    isOfficialStore: false,
    defaultRedirect: "/seller/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
  },
  {
    id: "superadmin",
    key: "superadmin",
    label: "Superadmin",
    subLabel: "Pengelola Ekosistem Platform FashionHub",
    badgeText: "SUPERADMIN",
    role: "SUPERADMIN",
    userId: "user-superadmin",
    defaultRedirect: "/superadmin/dashboard",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
  },
];

export function getDemoAccountByKey(key?: string | null): DemoAccount {
  return (
    DEMO_ACCOUNTS.find((acc) => acc.key === key) || DEMO_ACCOUNTS[0]
  );
}
