import React from "react";
import { db } from "@/lib/prisma";
import { SuperadminMarketingClient } from "@/components/superadmin-marketing-client";

export default function SuperadminMarketingPage() {
  const config = db.getMarketingConfig();
  return <SuperadminMarketingClient initialConfig={config} />;
}

