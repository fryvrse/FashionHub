"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  size: string;
  color: string;
  price: number;
  basePrice: number;
  quantity: number;
  maxStock: number;
  storeId: string;
  storeName: string;
  storeCity: string;
  isOfficialStore: boolean;
  selected: boolean;
}

export interface StoreCartGroup {
  storeId: string;
  storeName: string;
  storeCity: string;
  isOfficialStore: boolean;
  items: CartItem[];
  subTotal: number;
}

interface CartContextType {
  items: CartItem[];
  groupedByStore: StoreCartGroup[];
  selectedGroups: StoreCartGroup[];
  totalItemsCount: number;
  selectedItemsCount: number;
  selectedSubTotal: number;
  addItem: (item: Omit<CartItem, "selected">) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  toggleSelectItem: (variantId: string) => void;
  toggleSelectStore: (storeId: string, selected: boolean) => void;
  clearSelectedItems: () => void;
  clearCart: () => void;
  loadDemoMultiTenantCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "fashionhub_multitenant_cart_v3";

const DEFAULT_DEMO_CART: CartItem[] = [
  {
    variantId: "var-103",
    productId: "prod-1",
    productName:
      "Oversized Boxy Hoodie 'Garuda Noir' Cotton Fleece 330GSM - Washed Charcoal",
    productSlug: "oversized-heavyweight-boxy-hoodie-washed-charcoal",
    productImage:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80&sig=1",
    size: "L",
    color: "Washed Charcoal",
    price: 319000,
    basePrice: 449000,
    quantity: 1,
    maxStock: 18,
    storeId: "store-a",
    storeName: "StreetCult Official",
    storeCity: "Bandung",
    isOfficialStore: true,
    selected: true,
  },
  {
    variantId: "var-2102",
    productId: "prod-21",
    productName:
      "Kemeja Batik Slimfit Pria 'Parang Kencana' Katun Primisima Furing - Navy",
    productSlug: "kemeja-batik-slimfit-pria-parang-kencana",
    productImage:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80&sig=21",
    size: "M",
    color: "Navy Sogan",
    price: 349000,
    basePrice: 485000,
    quantity: 1,
    maxStock: 25,
    storeId: "store-b",
    storeName: "Batik Kencana Modern",
    storeCity: "Solo",
    isOfficialStore: true,
    selected: true,
  },
  {
    variantId: "var-4102",
    productId: "prod-41",
    productName:
      "Kemeja Linen Oversized Wanita 'Botanica' Linen Rami Premium - Sky Blue",
    productSlug: "kemeja-linen-oversized-botanica-linen-rami",
    productImage:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80&sig=41",
    size: "M",
    color: "Sky Blue",
    price: 249000,
    basePrice: 349000,
    quantity: 1,
    maxStock: 28,
    storeId: "store-c",
    storeName: "Cotton & Sage Daily",
    storeCity: "Jakarta Selatan",
    isOfficialStore: false,
    selected: true,
  },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        } else {
          setItems(DEFAULT_DEMO_CART);
        }
      } else {
        setItems(DEFAULT_DEMO_CART);
      }
    } catch {
      setItems(DEFAULT_DEMO_CART);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage error
    }
  }, [items, initialized]);

  const addItem = (newItem: Omit<CartItem, "selected">) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.variantId === newItem.variantId
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          quantity: Math.min(current.maxStock, current.quantity + newItem.quantity),
          selected: true,
        };
        return updated;
      }
      return [...prev, { ...newItem, selected: true }];
    });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(item.maxStock, quantity) }
          : item
      )
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const toggleSelectItem = (variantId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const toggleSelectStore = (storeId: string, selected: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.storeId === storeId ? { ...item, selected } : item
      )
    );
  };

  const clearSelectedItems = () => {
    setItems((prev) => prev.filter((item) => !item.selected));
  };

  const clearCart = () => {
    setItems([]);
  };

  const loadDemoMultiTenantCart = () => {
    setItems(DEFAULT_DEMO_CART);
  };

  // Group all items by storeId
  const groupedMap = new Map<string, StoreCartGroup>();
  for (const item of items) {
    if (!groupedMap.has(item.storeId)) {
      groupedMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        storeCity: item.storeCity,
        isOfficialStore: item.isOfficialStore,
        items: [],
        subTotal: 0,
      });
    }
    const group = groupedMap.get(item.storeId)!;
    group.items.push(item);
    if (item.selected) {
      group.subTotal += item.price * item.quantity;
    }
  }

  const groupedByStore = Array.from(groupedMap.values());

  const selectedGroups = groupedByStore
    .map((group) => {
      const selectedItems = group.items.filter((i) => i.selected);
      return {
        ...group,
        items: selectedItems,
        subTotal: selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    })
    .filter((g) => g.items.length > 0);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItemsCount = items
    .filter((i) => i.selected)
    .reduce((acc, item) => acc + item.quantity, 0);
  const selectedSubTotal = selectedGroups.reduce(
    (acc, g) => acc + g.subTotal,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        groupedByStore,
        selectedGroups,
        totalItemsCount,
        selectedItemsCount,
        selectedSubTotal,
        addItem,
        updateQuantity,
        removeItem,
        toggleSelectItem,
        toggleSelectStore,
        clearSelectedItems,
        clearCart,
        loadDemoMultiTenantCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

