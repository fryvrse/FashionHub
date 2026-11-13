import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SellerOrdersClient } from "@/components/seller-orders-client";

export default function SellerOrdersPage() {
  const session = getCurrentSession();
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    redirect("/");
  }

  // STRICT TENANT ISOLATION: Query SubOrders exclusively for session.storeId
  const store = db.getStoreById(session.storeId);
  if (!store) redirect("/");

  const subOrders = db.getSubOrdersByStore(session.storeId);

  return <SellerOrdersClient store={store} initialSubOrders={subOrders} />;
}

