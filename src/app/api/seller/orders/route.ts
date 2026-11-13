import { NextRequest, NextResponse } from "next/server";
import { db, prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { OrderStatusType } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "STORE_ADMIN" || !session.storeId) {
      return NextResponse.json(
        { error: "Unauthorized: Hanya STORE_ADMIN yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subOrderId, orderStatus, trackingNumber } = body as {
      subOrderId: string;
      orderStatus: OrderStatusType;
      trackingNumber?: string;
    };

    // Attempt Prisma MySQL update with strict storeId filter
    void prisma.subOrder
      .updateMany({
        where: {
          id: subOrderId,
          storeId: session.storeId,
        },
        data: {
          orderStatus,
          ...(trackingNumber
            ? {
                shippingCourier: `${
                  body.shippingCourier || "Kurir"
                } (Resi: ${trackingNumber})`,
              }
            : {}),
        },
      })
      .catch(() => {
        // Fallback to zero-config snapshot
      });

    // Strict Multi-Tenant check: session.storeId MUST match the SubOrder's storeId
    const updated = db.updateSubOrderStatus({
      subOrderId,
      storeId: session.storeId,
      orderStatus,
      trackingNumber,
    });

    if (!updated) {
      return NextResponse.json(
        {
          error:
            "SubOrder tidak ditemukan atau bukan milik tenant (storeId) Anda.",
        },
        { status: 404 }
      );
    }

    const updatedSubOrder = db
      .getSubOrdersByStore(session.storeId)
      .find((s) => s.id === subOrderId);

    return NextResponse.json({
      success: true,
      storeId: session.storeId,
      subOrderId,
      orderStatus,
      trackingNumber: updatedSubOrder?.trackingNumber || trackingNumber,
      subOrder: updatedSubOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan toko." },
      { status: 500 }
    );
  }
}
