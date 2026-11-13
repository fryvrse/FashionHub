import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SellerProductsClient } from "@/components/seller-products-client";

export default function SellerProductsPage() {
  const session = getCurrentSession();
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    redirect("/");
  }

  // STRICT TENANT ISOLATION: Query strictly by session.storeId
  const store = db.getStoreById(session.storeId);
  if (!store) redirect("/");

  const products = db.getProducts({ storeId: session.storeId });

  return <SellerProductsClient store={store} initialProducts={products} />;
}

