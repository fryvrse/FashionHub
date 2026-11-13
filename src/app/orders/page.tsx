import React from "react";
import { db } from "@/lib/prisma";
import { BuyerOrdersClient } from "@/components/buyer-orders-client";

export const dynamic = "force-dynamic";

export default function BuyerOrdersPage() {
  const orders = db.getOrders("user-buyer");
  return <BuyerOrdersClient initialOrders={orders} />;
}
