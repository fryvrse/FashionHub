import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "USER" && session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Hanya Buyer (USER) yang dapat melakukan Checkout pesanan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { groups } = body;

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja kosong." },
        { status: 400 }
      );
    }

    const createdOrder = db.createSplitOrder({
      buyerId: session.userId,
      groups,
    });

    return NextResponse.json({
      success: true,
      order: createdOrder,
      splitCount: createdOrder.subOrders.length,
    });
  } catch (error) {
    console.error("Checkout Split Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses Multi-Tenant Split Checkout." },
      { status: 500 }
    );
  }
}

