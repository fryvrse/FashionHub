import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import {
  INITIAL_USERS,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_WITHDRAWALS,
  INITIAL_MARKETING_CONFIG,
  DEFAULT_BUYER_ADDRESS,
  buildTrackingLogsForStage,
  getDefaultTrackingStage,
  generateAutoResi,
  BuyerShippingAddress,
  TrackingLogEntry,
  SeedUser,
  SeedStore,
  SeedProduct,
  SeedVariant,
  SeedOrder,
  SeedSubOrder,
  SeedWithdrawal,
  MarketingConfig,
  OrderStatusType,
  StoreStatusType,
  RoleType,
  WithdrawalStatusType,
} from "../../prisma/seed-data";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export interface SnapshotDB {
  users: SeedUser[];
  stores: SeedStore[];
  products: SeedProduct[];
  orders: SeedOrder[];
  withdrawals: SeedWithdrawal[];
  marketing: MarketingConfig;
  seededAt: string;
}

const SNAPSHOT_PATH = path.join(process.cwd(), ".data", "mysql-snapshot.json");

function ensureSnapshot(): SnapshotDB {
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      const raw = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
      const parsed = JSON.parse(raw) as SnapshotDB;
      // If snapshot is from an older schema (< 100 products across 5 Local Pride stores), upgrade it immediately
      const hasFull100Catalog =
        Array.isArray(parsed.stores) &&
        parsed.stores.length >= 5 &&
        Array.isArray(parsed.products) &&
        parsed.products.length >= 100 &&
        parsed.products.some((p) => p.id === "prod-100");
      if (!hasFull100Catalog) {
        const upgraded: SnapshotDB = {
          users: JSON.parse(JSON.stringify(INITIAL_USERS)),
          stores: JSON.parse(JSON.stringify(INITIAL_STORES)),
          products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
          orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
          withdrawals: JSON.parse(JSON.stringify(INITIAL_WITHDRAWALS)),
          marketing: JSON.parse(JSON.stringify(INITIAL_MARKETING_CONFIG)),
          seededAt: new Date().toISOString(),
        };
        saveSnapshot(upgraded);
        return upgraded;
      }
      let dirty = false;
      if (!parsed.withdrawals) {
        parsed.withdrawals = JSON.parse(JSON.stringify(INITIAL_WITHDRAWALS));
        dirty = true;
      }
      if (!parsed.marketing) {
        parsed.marketing = JSON.parse(JSON.stringify(INITIAL_MARKETING_CONFIG));
        dirty = true;
      }
      for (const initProd of INITIAL_PRODUCTS) {
        const existing = parsed.products.find((p) => p.id === initProd.id);
        if (!existing) {
          parsed.products.push(JSON.parse(JSON.stringify(initProd)));
          dirty = true;
          continue;
        }
        // Upgrade legacy split variants (e.g. Color A = S/M/L, Color B = XL only)
        // to the full Cartesian color × size matrix.
        const existingCombos = new Set(
          existing.variants.map((v) => `${v.color}__${v.size}`)
        );
        const missingCombo = initProd.variants.some(
          (v) => !existingCombos.has(`${v.color}__${v.size}`)
        );
        if (missingCombo || existing.variants.length !== initProd.variants.length) {
          existing.variants = JSON.parse(JSON.stringify(initProd.variants));
          dirty = true;
        }
      }
      const storeCityMap = new Map(parsed.stores.map((s) => [s.id, s.city]));
      for (const ord of parsed.orders) {
        if (!ord.shippingAddress) {
          ord.shippingAddress = JSON.parse(JSON.stringify(DEFAULT_BUYER_ADDRESS));
          dirty = true;
        }
        for (const sub of ord.subOrders) {
          if (!Array.isArray(sub.trackingLogs) || sub.trackingLogs.length === 0) {
            const originCity = storeCityMap.get(sub.storeId) || "Bandung";
            const built = buildTrackingLogsForStage({
              subOrderId: sub.id,
              orderStatus: sub.orderStatus,
              shippingCourier: sub.shippingCourier,
              trackingNumber: sub.trackingNumber,
              originCity,
              destCity: ord.shippingAddress?.city || "Jakarta Selatan",
              trackingStage: sub.trackingStage,
            });
            sub.trackingStage = built.trackingStage;
            if (built.trackingNumber) sub.trackingNumber = built.trackingNumber;
            sub.trackingLogs = built.trackingLogs;
            dirty = true;
          }
        }
      }
      if (dirty) {
        saveSnapshot(parsed);
      }
      return parsed;
    }
  } catch {
    // Fallback to initial seed data
  }

  const initial: SnapshotDB = {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    stores: JSON.parse(JSON.stringify(INITIAL_STORES)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    withdrawals: JSON.parse(JSON.stringify(INITIAL_WITHDRAWALS)),
    marketing: JSON.parse(JSON.stringify(INITIAL_MARKETING_CONFIG)),
    seededAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(SNAPSHOT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(initial, null, 2), "utf-8");
  } catch {
    // Ignore write error in read-only environments
  }

  return initial;
}

function saveSnapshot(data: SnapshotDB) {
  try {
    const dir = path.dirname(SNAPSHOT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save snapshot:", err);
  }
}

export interface EnrichedProduct extends SeedProduct {
  store: SeedStore;
}

export interface EnrichedOrderItem {
  id: string;
  subOrderId: string;
  variantId: string;
  quantity: number;
  price: number;
  variant: SeedVariant & {
    product: SeedProduct;
  };
}

export interface EnrichedSubOrder extends Omit<SeedSubOrder, "items"> {
  store: SeedStore;
  order?: {
    id: string;
    buyerId: string;
    totalAmount: number;
    paymentStatus: string;
    shippingAddress?: BuyerShippingAddress;
    createdAt: string;
    buyer: SeedUser;
  };
  items: EnrichedOrderItem[];
}

export interface EnrichedOrder extends Omit<SeedOrder, "subOrders"> {
  buyer: SeedUser;
  subOrders: EnrichedSubOrder[];
}

export interface EnrichedUser extends SeedUser {
  ownedStore?: SeedStore | null;
  ordersCount: number;
  totalSpent: number;
}

export interface EnrichedWithdrawal extends SeedWithdrawal {
  store: SeedStore;
}

export const db = {
  /**
   * Fetch all products from ACTIVE stores (with optional category & search filter)
   */
  getProducts(filters?: {
    category?: string;
    search?: string;
    storeId?: string;
    onlyFeatured?: boolean;
  }): EnrichedProduct[] {
    const state = ensureSnapshot();
    const storeMap = new Map(state.stores.map((s) => [s.id, s]));

    const filtered = state.products
      .map((p) => {
        const store = storeMap.get(p.storeId)!;
        return { ...p, store };
      })
      .filter((p) => {
        if (!p.store) return false;
        // If not filtering by a specific seller store, only show ACTIVE stores on marketplace
        if (!filters?.storeId && p.store.status !== "ACTIVE") return false;
        if (filters?.storeId && p.storeId !== filters.storeId) return false;
        if (
          filters?.category &&
          filters.category !== "Semua" &&
          p.category.toLowerCase() !== filters.category.toLowerCase()
        ) {
          return false;
        }
        if (filters?.onlyFeatured && !p.isFeatured) return false;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchStore = p.store.name.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchStore) return false;
        }
        return true;
      });

    // When browsing cross-tenant marketplace (no single storeId filter), interleave products across stores
    // so every row on the homepage showcases a balanced variety of all 5 stores with zero adjacent photo reuse
    if (!filters?.storeId) {
      const buckets = new Map<string, EnrichedProduct[]>();
      for (const item of filtered) {
        if (!buckets.has(item.storeId)) buckets.set(item.storeId, []);
        buckets.get(item.storeId)!.push(item);
      }
      const interleaved: EnrichedProduct[] = [];
      let maxLen = 0;
      buckets.forEach((arr) => {
        if (arr.length > maxLen) maxLen = arr.length;
      });
      for (let i = 0; i < maxLen; i++) {
        buckets.forEach((arr) => {
          if (i < arr.length) interleaved.push(arr[i]);
        });
      }
      return interleaved;
    }

    return filtered;
  },

  /**
   * Fetch single product by slug with store and variants
   */
  getProductBySlug(slug: string): EnrichedProduct | null {
    const state = ensureSnapshot();
    const product = state.products.find((p) => p.slug === slug);
    if (!product) return null;
    const store = state.stores.find((s) => s.id === product.storeId);
    if (!store) return null;
    return { ...product, store };
  },

  /**
   * Fetch store by ID with strict tenant isolation
   */
  getStoreById(storeId: string): (SeedStore & { owner: SeedUser }) | null {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === storeId);
    if (!store) return null;
    const owner = state.users.find((u) => u.id === store.ownerId)!;
    return { ...store, owner };
  },

  /**
   * Fetch all stores (for Superadmin)
   */
  getAllStores(): (SeedStore & {
    owner: SeedUser;
    productCount: number;
    subOrderCount: number;
  })[] {
    const state = ensureSnapshot();
    return state.stores.map((store) => {
      const owner = state.users.find((u) => u.id === store.ownerId)!;
      const productCount = state.products.filter(
        (p) => p.storeId === store.id
      ).length;
      let subOrderCount = 0;
      for (const ord of state.orders) {
        subOrderCount += ord.subOrders.filter(
          (so) => so.storeId === store.id
        ).length;
      }
      return {
        ...store,
        owner,
        productCount,
        subOrderCount,
      };
    });
  },

  /**
   * Fetch SubOrders strictly isolated for a single Store (Tenant)
   */
  getSubOrdersByStore(storeId: string): EnrichedSubOrder[] {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === storeId);
    if (!store) return [];

    const variantMap = new Map<
      string,
      SeedVariant & { product: SeedProduct }
    >();
    for (const prod of state.products) {
      for (const v of prod.variants) {
        variantMap.set(v.id, { ...v, product: prod });
      }
    }

    const result: EnrichedSubOrder[] = [];
    for (const order of state.orders) {
      const buyer =
        state.users.find((u) => u.id === order.buyerId) || state.users[3];
      for (const sub of order.subOrders) {
        if (sub.storeId === storeId) {
          result.push({
            ...sub,
            store,
            order: {
              id: order.id,
              buyerId: order.buyerId,
              totalAmount: order.totalAmount,
              paymentStatus: order.paymentStatus,
              shippingAddress: order.shippingAddress || DEFAULT_BUYER_ADDRESS,
              createdAt: order.createdAt,
              buyer,
            },
            items: sub.items.map((item) => ({
              ...item,
              variant: variantMap.get(item.variantId)!,
            })),
          });
        }
      }
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Fetch Orders for a Buyer (or all orders for Superadmin)
   */
  getOrders(buyerId?: string): EnrichedOrder[] {
    const state = ensureSnapshot();
    const storeMap = new Map(state.stores.map((s) => [s.id, s]));
    const userMap = new Map(state.users.map((u) => [u.id, u]));
    const variantMap = new Map<
      string,
      SeedVariant & { product: SeedProduct }
    >();
    for (const prod of state.products) {
      for (const v of prod.variants) {
        variantMap.set(v.id, { ...v, product: prod });
      }
    }

    return state.orders
      .filter((o) => (!buyerId ? true : o.buyerId === buyerId))
      .map((order) => ({
        ...order,
        shippingAddress: order.shippingAddress || DEFAULT_BUYER_ADDRESS,
        buyer: userMap.get(order.buyerId) || state.users[3],
        subOrders: order.subOrders.map((sub) => ({
          ...sub,
          store: storeMap.get(sub.storeId)!,
          order: {
            id: order.id,
            buyerId: order.buyerId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            shippingAddress: order.shippingAddress || DEFAULT_BUYER_ADDRESS,
            createdAt: order.createdAt,
            buyer: userMap.get(order.buyerId) || state.users[3],
          },
          items: sub.items.map((item) => ({
            ...item,
            variant: variantMap.get(item.variantId)!,
          })),
        })),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  /**
   * Multi-Tenant Order Splitting Engine:
   * Takes a buyer's multi-store cart and atomically creates:
   * - 1 Master `Order`
   * - N `SubOrder` records (1 per unique `storeId`)
   * - M `OrderItem` records & decrements `ProductVariant` stock + increments Store balance
   */
  createSplitOrder(payload: {
    buyerId: string;
    groups: {
      storeId: string;
      shippingCourier: string;
      shippingCost: number;
      items: {
        variantId: string;
        quantity: number;
        price: number;
      }[];
    }[];
  }): EnrichedOrder {
    const state = ensureSnapshot();
    const now = new Date().toISOString();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const datePart = now.slice(0, 10).replace(/-/g, "");
    const orderId = `ORD-${datePart}-${randomSuffix}`;

    let masterTotal = 0;
    const subOrders: SeedSubOrder[] = [];

    payload.groups.forEach((group, idx) => {
      const subTotal = group.items.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0
      );
      const groupTotal = subTotal + group.shippingCost;
      masterTotal += groupTotal;

      const subOrderId = `SUB-${datePart}-${randomSuffix}-${idx + 1}`;
      const orderItems = group.items.map((it, itemIdx) => {
        // Decrement variant stock
        for (const prod of state.products) {
          const variant = prod.variants.find((v) => v.id === it.variantId);
          if (variant) {
            variant.stock = Math.max(0, variant.stock - it.quantity);
          }
        }

        return {
          id: `ITEM-${Date.now()}-${idx}-${itemIdx}`,
          subOrderId,
          variantId: it.variantId,
          quantity: it.quantity,
          price: it.price,
        };
      });

      // Credit store balance
      const store = state.stores.find((s) => s.id === group.storeId);
      if (store) {
        store.balance += subTotal;
      }

      const builtLogs = buildTrackingLogsForStage({
        subOrderId,
        orderStatus: "NEW",
        shippingCourier: group.shippingCourier,
        originCity: store?.city || "Bandung",
        destCity: DEFAULT_BUYER_ADDRESS.city,
        trackingStage: 0,
      });

      subOrders.push({
        id: subOrderId,
        orderId,
        storeId: group.storeId,
        subTotal,
        shippingCost: group.shippingCost,
        shippingCourier: group.shippingCourier,
        trackingNumber: builtLogs.trackingNumber,
        trackingStage: builtLogs.trackingStage,
        trackingLogs: builtLogs.trackingLogs,
        orderStatus: "NEW",
        createdAt: now,
        items: orderItems,
      });
    });

    const newOrder: SeedOrder = {
      id: orderId,
      buyerId: payload.buyerId,
      totalAmount: masterTotal,
      paymentStatus: "PAID",
      shippingAddress: DEFAULT_BUYER_ADDRESS,
      createdAt: now,
      subOrders,
    };

    state.orders.unshift(newOrder);
    saveSnapshot(state);

    return this.getOrders().find((o) => o.id === orderId)!;
  },

  /**
   * Update SubOrder status & optional courier trackingNumber (Strictly verified against storeId for STORE_ADMIN)
   */
  updateSubOrderStatus(params: {
    subOrderId: string;
    storeId: string;
    orderStatus: OrderStatusType;
    trackingNumber?: string;
    trackingStage?: number;
  }): boolean {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === params.storeId);
    for (const order of state.orders) {
      const sub = order.subOrders.find(
        (s) => s.id === params.subOrderId && s.storeId === params.storeId
      );
      if (sub) {
        sub.orderStatus = params.orderStatus;
        if (params.trackingNumber && params.trackingNumber.trim()) {
          sub.trackingNumber = params.trackingNumber.trim();
        }
        const nextStage =
          typeof params.trackingStage === "number"
            ? params.trackingStage
            : params.orderStatus === "NEW"
            ? 0
            : params.orderStatus === "PACKING"
            ? 1
            : params.orderStatus === "SHIPPED"
            ? 2 // Start at Origin Sorting Center (Hub Asal) when newly shipped from Seller Center
            : params.orderStatus === "COMPLETED"
            ? 5
            : 0;
        const built = buildTrackingLogsForStage({
          subOrderId: sub.id,
          orderStatus: params.orderStatus,
          shippingCourier: sub.shippingCourier,
          trackingNumber: sub.trackingNumber,
          originCity: store?.city || "Bandung",
          destCity: order.shippingAddress?.city || "Jakarta Selatan",
          trackingStage: nextStage,
        });
        sub.trackingStage = built.trackingStage;
        sub.trackingNumber = built.trackingNumber;
        sub.trackingLogs = built.trackingLogs;
        saveSnapshot(state);
        return true;
      }
    }
    return false;
  },

  /**
   * Live Shipment Checkpoint Simulation & Buyer Order Completion ("Pesanan Diterima")
   */
  advanceOrUpdateSubOrderTracking(params: {
    subOrderId: string;
    action: "ADVANCE_CHECKPOINT" | "SET_STAGE" | "COMPLETE_ORDER";
    targetStage?: number;
  }): EnrichedSubOrder | null {
    const state = ensureSnapshot();
    for (const order of state.orders) {
      const sub = order.subOrders.find((s) => s.id === params.subOrderId);
      if (sub) {
        const store = state.stores.find((s) => s.id === sub.storeId);
        const currentStage =
          typeof sub.trackingStage === "number"
            ? sub.trackingStage
            : getDefaultTrackingStage(sub.orderStatus);

        let nextStage = currentStage;
        if (params.action === "COMPLETE_ORDER") {
          nextStage = 5;
        } else if (
          params.action === "SET_STAGE" &&
          typeof params.targetStage === "number"
        ) {
          nextStage = Math.max(0, Math.min(5, params.targetStage));
        } else if (params.action === "ADVANCE_CHECKPOINT") {
          // Cycle through 2 (Origin Hub) -> 3 (Jakarta Gateway) -> 4 (Out for Delivery) -> 5 (Delivered)
          if (currentStage < 5) {
            nextStage = currentStage + 1;
          } else {
            nextStage = 2; // Reset back to Origin Hub so user can replay courier movement in live demo
          }
        }

        const nextStatus: OrderStatusType =
          nextStage === 0
            ? "NEW"
            : nextStage === 1
            ? "PACKING"
            : nextStage >= 2 && nextStage <= 4
            ? "SHIPPED"
            : "COMPLETED";

        // When transitioning into COMPLETED, ensure store escrow reflects completion
        if (sub.orderStatus !== "COMPLETED" && nextStatus === "COMPLETED" && store) {
          // Store balance already credited on split order creation; record timestamp update
        }

        sub.orderStatus = nextStatus;
        const built = buildTrackingLogsForStage({
          subOrderId: sub.id,
          orderStatus: nextStatus,
          shippingCourier: sub.shippingCourier,
          trackingNumber: sub.trackingNumber,
          originCity: store?.city || "Bandung",
          destCity: order.shippingAddress?.city || "Jakarta Selatan",
          trackingStage: nextStage,
        });
        sub.trackingStage = built.trackingStage;
        sub.trackingNumber = built.trackingNumber;
        sub.trackingLogs = built.trackingLogs;
        saveSnapshot(state);

        const refreshedOrder = this.getOrders().find((o) => o.id === order.id);
        return (
          refreshedOrder?.subOrders.find((s) => s.id === params.subOrderId) ||
          null
        );
      }
    }
    return null;
  },

  /**
   * Create a new Product + ProductVariant Matrix strictly isolated to `storeId`
   */
  createProductForStore(
    storeId: string,
    payload: {
      name: string;
      category: string;
      basePrice: number;
      discountPrice?: number | null;
      images: string[];
      isFeatured?: boolean;
      variants: {
        size: string;
        color: string;
        stock: number;
      }[];
    }
  ): EnrichedProduct | null {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === storeId);
    if (!store) return null;

    const productId = `prod-${Date.now()}`;
    const baseSlug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const variants: SeedVariant[] = payload.variants.map((v, idx) => ({
      id: `var-${Date.now()}-${idx + 1}`,
      productId,
      size: v.size,
      color: v.color,
      stock: Math.max(0, Number(v.stock) || 0),
    }));

    const newProduct: SeedProduct = {
      id: productId,
      storeId,
      name: payload.name,
      slug,
      category: payload.category,
      basePrice: Number(payload.basePrice) || 0,
      discountPrice:
        payload.discountPrice && Number(payload.discountPrice) > 0
          ? Number(payload.discountPrice)
          : null,
      images:
        payload.images.length > 0
          ? payload.images
          : [
              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80",
            ],
      isFeatured: Boolean(payload.isFeatured),
      createdAt: new Date().toISOString(),
      variants,
    };

    state.products.unshift(newProduct);
    saveSnapshot(state);

    return { ...newProduct, store };
  },

  /**
   * Delete a Product strictly owned by `storeId`
   */
  deleteProductForStore(storeId: string, productId: string): boolean {
    const state = ensureSnapshot();
    const idx = state.products.findIndex(
      (p) => p.id === productId && p.storeId === storeId
    );
    if (idx === -1) return false;
    state.products.splice(idx, 1);
    saveSnapshot(state);
    return true;
  },

  /**
   * Update Store profile settings strictly isolated to `storeId`
   */
  updateStoreSettings(
    storeId: string,
    payload: {
      name: string;
      slug: string;
      city: string;
      bannerUrl?: string;
      description?: string;
    }
  ): (SeedStore & { owner: SeedUser }) | null {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === storeId);
    if (!store) return null;

    if (payload.name.trim()) store.name = payload.name.trim();
    if (payload.slug.trim()) {
      store.slug = payload.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-");
    }
    if (payload.city.trim()) store.city = payload.city.trim();
    if (typeof payload.bannerUrl === "string") {
      store.bannerUrl = payload.bannerUrl.trim();
    }
    if (typeof payload.description === "string") {
      store.description = payload.description.trim();
    }

    saveSnapshot(state);
    const owner = state.users.find((u) => u.id === store.ownerId)!;
    return { ...store, owner };
  },

  /**
   * Compute Real-Time Metrics & Weekly Sales Trend strictly for `storeId`
   */
  getStoreAnalytics(storeId: string) {
    const store = this.getStoreById(storeId);
    const products = this.getProducts({ storeId });
    const subOrders = this.getSubOrdersByStore(storeId);

    const newOrdersCount = subOrders.filter(
      (s) => s.orderStatus === "NEW"
    ).length;
    const packingOrdersCount = subOrders.filter(
      (s) => s.orderStatus === "PACKING"
    ).length;
    const shippedOrdersCount = subOrders.filter(
      (s) => s.orderStatus === "SHIPPED"
    ).length;
    const completedOrdersCount = subOrders.filter(
      (s) => s.orderStatus === "COMPLETED"
    ).length;

    const activeOrderRevenue = subOrders
      .filter((s) => s.orderStatus !== "CANCELLED")
      .reduce((sum, s) => sum + s.subTotal, 0);

    // Base historical weekly sales per store + live SubOrders
    const weeklyPresets: Record<
      string,
      { day: string; label: string; revenue: number; orders: number }[]
    > = {
      "store-a": [
        { day: "Sen", label: "Senin", revenue: 1850000, orders: 6 },
        { day: "Sel", label: "Selasa", revenue: 2420000, orders: 8 },
        { day: "Rab", label: "Rabu", revenue: 1980000, orders: 7 },
        { day: "Kam", label: "Kamis", revenue: 3150000, orders: 11 },
        { day: "Jum", label: "Jumat", revenue: 2890000, orders: 9 },
        { day: "Sab", label: "Sabtu", revenue: 4120000, orders: 14 },
        {
          day: "Min",
          label: "Minggu (Hari Ini)",
          revenue: 2250000 + activeOrderRevenue,
          orders: 5 + subOrders.length,
        },
      ],
      "store-b": [
        { day: "Sen", label: "Senin", revenue: 1420000, orders: 4 },
        { day: "Sel", label: "Selasa", revenue: 1780000, orders: 5 },
        { day: "Rab", label: "Rabu", revenue: 2290000, orders: 7 },
        { day: "Kam", label: "Kamis", revenue: 2040000, orders: 6 },
        { day: "Jum", label: "Jumat", revenue: 2950000, orders: 9 },
        { day: "Sab", label: "Sabtu", revenue: 3490000, orders: 10 },
        {
          day: "Min",
          label: "Minggu (Hari Ini)",
          revenue: 1680000 + activeOrderRevenue,
          orders: 4 + subOrders.length,
        },
      ],
      "store-c": [
        { day: "Sen", label: "Senin", revenue: 1150000, orders: 4 },
        { day: "Sel", label: "Selasa", revenue: 1540000, orders: 6 },
        { day: "Rab", label: "Rabu", revenue: 1890000, orders: 7 },
        { day: "Kam", label: "Kamis", revenue: 1720000, orders: 6 },
        { day: "Jum", label: "Jumat", revenue: 2380000, orders: 8 },
        { day: "Sab", label: "Sabtu", revenue: 2840000, orders: 10 },
        {
          day: "Min",
          label: "Minggu (Hari Ini)",
          revenue: 1450000 + activeOrderRevenue,
          orders: 4 + subOrders.length,
        },
      ],
      "store-d": [
        { day: "Sen", label: "Senin", revenue: 1680000, orders: 5 },
        { day: "Sel", label: "Selasa", revenue: 2120000, orders: 6 },
        { day: "Rab", label: "Rabu", revenue: 1950000, orders: 5 },
        { day: "Kam", label: "Kamis", revenue: 2640000, orders: 8 },
        { day: "Jum", label: "Jumat", revenue: 3180000, orders: 9 },
        { day: "Sab", label: "Sabtu", revenue: 3890000, orders: 11 },
        {
          day: "Min",
          label: "Minggu (Hari Ini)",
          revenue: 1920000 + activeOrderRevenue,
          orders: 5 + subOrders.length,
        },
      ],
      "store-e": [
        { day: "Sen", label: "Senin", revenue: 980000, orders: 3 },
        { day: "Sel", label: "Selasa", revenue: 1340000, orders: 5 },
        { day: "Rab", label: "Rabu", revenue: 1620000, orders: 6 },
        { day: "Kam", label: "Kamis", revenue: 1890000, orders: 7 },
        { day: "Jum", label: "Jumat", revenue: 2560000, orders: 9 },
        { day: "Sab", label: "Sabtu", revenue: 2740000, orders: 9 },
        {
          day: "Min",
          label: "Minggu (Hari Ini)",
          revenue: 1320000 + activeOrderRevenue,
          orders: 4 + subOrders.length,
        },
      ],
    };

    const baseWeekly = weeklyPresets[storeId] || weeklyPresets["store-a"];

    const monthlyRevenue = baseWeekly.reduce((sum, d) => sum + d.revenue, 0);

    return {
      escrowBalance: store?.balance ?? 0,
      newOrdersCount,
      packingOrdersCount,
      shippedOrdersCount,
      completedOrdersCount,
      activeProductsCount: products.length,
      totalVariantsStock: products.reduce(
        (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0),
        0
      ),
      monthlyRevenue,
      weeklySalesTrend: baseWeekly,
    };
  },

  /**
   * Update Store status or Official Store badge (For SUPERADMIN)
   */
  updateStoreStatus(params: {
    storeId: string;
    status?: StoreStatusType;
    isOfficialStore?: boolean;
  }): boolean {
    const state = ensureSnapshot();
    const store = state.stores.find((s) => s.id === params.storeId);
    if (!store) return false;
    if (params.status) store.status = params.status;
    if (typeof params.isOfficialStore === "boolean") {
      store.isOfficialStore = params.isOfficialStore;
    }
    saveSnapshot(state);
    return true;
  },

  /**
   * Superadmin Executive Overview Aggregate Metrics (MySQL + Snapshot)
   */
  getSuperadminExecutiveMetrics() {
    const state = ensureSnapshot();
    const orders = this.getOrders();
    const stores = this.getAllStores();
    const users = this.getAllUsers();
    const withdrawals = this.getWithdrawals();
    const marketing = this.getMarketingConfig();

    const commissionRate = (marketing.commissionRatePercent || 5) / 100;

    // Total GMV from all Master Orders (paid/active transactions)
    const totalGMV = orders
      .filter((o) => o.paymentStatus !== "FAILED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Subtotal of merchandise across all SubOrders
    const totalMerchandiseValue = orders.reduce(
      (sum, o) =>
        sum +
        o.subOrders
          .filter((s) => s.orderStatus !== "CANCELLED")
          .reduce((sSum, s) => sSum + s.subTotal, 0),
      0
    );

    const totalCommission = Math.round(totalGMV * commissionRate);
    const totalEscrowBalance = stores.reduce((sum, s) => sum + s.balance, 0);

    const activeStoresCount = stores.filter((s) => s.status === "ACTIVE").length;
    const pendingStoresCount = stores.filter((s) => s.status === "PENDING").length;
    const suspendedStoresCount = stores.filter(
      (s) => s.status === "SUSPENDED"
    ).length;

    const totalSubOrdersCount = orders.reduce(
      (sum, o) => sum + o.subOrders.length,
      0
    );

    const pendingWithdrawals = withdrawals.filter(
      (w) => w.status === "PENDING"
    );
    const approvedWithdrawals = withdrawals.filter(
      (w) => w.status === "APPROVED"
    );

    return {
      totalGMV,
      totalMerchandiseValue,
      totalCommission,
      commissionRatePercent: marketing.commissionRatePercent || 5,
      totalEscrowBalance,
      activeStoresCount,
      pendingStoresCount,
      suspendedStoresCount,
      totalStoresCount: stores.length,
      totalUsersCount: users.length,
      superadminCount: users.filter((u) => u.role === "SUPERADMIN").length,
      storeAdminCount: users.filter((u) => u.role === "STORE_ADMIN").length,
      buyerCount: users.filter((u) => u.role === "USER").length,
      totalOrdersCount: orders.length,
      totalSubOrdersCount,
      totalProductsCount: state.products.length,
      activeCatalogProductsCount: this.getProducts().length,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingWithdrawals.reduce(
        (sum, w) => sum + w.amount,
        0
      ),
      approvedWithdrawalsAmount: approvedWithdrawals.reduce(
        (sum, w) => sum + w.amount,
        0
      ),
    };
  },

  /**
   * Fetch all Users with owned Store & Buyer Order stats (For SUPERADMIN /superadmin/users)
   */
  getAllUsers(roleFilter?: string): EnrichedUser[] {
    const state = ensureSnapshot();
    return state.users
      .filter((u) =>
        !roleFilter || roleFilter === "ALL" ? true : u.role === roleFilter
      )
      .map((u) => {
        const ownedStore =
          state.stores.find((s) => s.ownerId === u.id) || null;
        const userOrders = state.orders.filter((o) => o.buyerId === u.id);
        const totalSpent = userOrders.reduce(
          (sum, o) => sum + o.totalAmount,
          0
        );
        return {
          ...u,
          ownedStore,
          ordersCount: userOrders.length,
          totalSpent,
        };
      });
  },

  /**
   * Update User Role or Profile (For SUPERADMIN /superadmin/users)
   */
  updateUserRoleAndProfile(params: {
    userId: string;
    role?: RoleType;
    name?: string;
    email?: string;
  }): EnrichedUser | null {
    const state = ensureSnapshot();
    const user = state.users.find((u) => u.id === params.userId);
    if (!user) return null;

    if (params.role) user.role = params.role;
    if (params.name && params.name.trim()) user.name = params.name.trim();
    if (params.email && params.email.trim()) user.email = params.email.trim();

    saveSnapshot(state);
    return this.getAllUsers().find((u) => u.id === params.userId) || null;
  },

  /**
   * Create a new User account (For SUPERADMIN /superadmin/users)
   */
  createUser(payload: {
    name: string;
    email: string;
    role: RoleType;
  }): EnrichedUser {
    const state = ensureSnapshot();
    const newUser: SeedUser = {
      id: `user-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
    };
    state.users.unshift(newUser);
    saveSnapshot(state);
    return this.getAllUsers().find((u) => u.id === newUser.id)!;
  },

  /**
   * Fetch all Escrow Withdrawal requests (For SUPERADMIN /superadmin/finance)
   */
  getWithdrawals(): EnrichedWithdrawal[] {
    const state = ensureSnapshot();
    const storeMap = new Map(state.stores.map((s) => [s.id, s]));
    return (state.withdrawals || [])
      .map((w) => ({
        ...w,
        store: storeMap.get(w.storeId) || state.stores[0],
      }))
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
  },

  /**
   * Approve or Reject a Store Escrow Withdrawal request (For SUPERADMIN /superadmin/finance)
   */
  processWithdrawal(params: {
    withdrawalId: string;
    status: WithdrawalStatusType;
    notes?: string;
  }): EnrichedWithdrawal | null {
    const state = ensureSnapshot();
    const wd = state.withdrawals.find((w) => w.id === params.withdrawalId);
    if (!wd) return null;

    // Only deduct balance once when transitioning from PENDING to APPROVED
    if (wd.status === "PENDING" && params.status === "APPROVED") {
      const store = state.stores.find((s) => s.id === wd.storeId);
      if (store) {
        store.balance = Math.max(0, store.balance - wd.amount);
      }
    }

    wd.status = params.status;
    wd.processedAt = new Date().toISOString();
    if (params.notes && params.notes.trim()) {
      wd.notes = params.notes.trim();
    }

    saveSnapshot(state);
    return (
      this.getWithdrawals().find((w) => w.id === params.withdrawalId) || null
    );
  },

  /**
   * Get Global Marketing & Flash Sale Configuration (For Homepage & /superadmin/marketing)
   */
  getMarketingConfig(): MarketingConfig {
    const state = ensureSnapshot();
    return state.marketing || INITIAL_MARKETING_CONFIG;
  },

  /**
   * Update Global Marketing & Flash Sale Configuration (For SUPERADMIN /superadmin/marketing)
   */
  updateMarketingConfig(
    payload: Partial<MarketingConfig>
  ): MarketingConfig {
    const state = ensureSnapshot();
    state.marketing = {
      ...(state.marketing || INITIAL_MARKETING_CONFIG),
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    saveSnapshot(state);
    return state.marketing;
  },
};

