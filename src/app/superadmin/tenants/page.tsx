import React from "react";
import { db } from "@/lib/prisma";
import { SuperadminTenantsClient } from "@/components/superadmin-tenants-client";

export default function SuperadminTenantsPage() {
  const stores = db.getAllStores();
  return <SuperadminTenantsClient initialStores={stores} />;
}

