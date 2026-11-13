import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SellerSettingsClient } from "@/components/seller-settings-client";

export default function SellerSettingsPage() {
  const session = getCurrentSession();
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    redirect("/");
  }

  // STRICT TENANT ISOLATION: Query Store exclusively by session.storeId
  const store = db.getStoreById(session.storeId);
  if (!store) redirect("/");

  return <SellerSettingsClient store={store} />;
}

