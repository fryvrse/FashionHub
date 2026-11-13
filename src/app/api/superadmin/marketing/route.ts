import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { MarketingConfig } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Hanya SUPERADMIN yang dapat mengatur kampanye global.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<MarketingConfig>;
    const updated = db.updateMarketingConfig(body);

    return NextResponse.json({
      success: true,
      marketing: updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui konfigurasi marketing global." },
      { status: 500 }
    );
  }
}

