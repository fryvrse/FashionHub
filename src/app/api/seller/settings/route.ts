import { NextRequest, NextResponse } from "next/server";
import { db, prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

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
    const { name, slug, city, bannerUrl, description } = body;

    if (!name || !slug || !city) {
      return NextResponse.json(
        { error: "Nama Toko, Slug, dan Kota Pengiriman wajib diisi." },
        { status: 400 }
      );
    }

    // Attempt Prisma MySQL update strictly where id === session.storeId
    try {
      await prisma.store.update({
        where: { id: session.storeId },
        data: {
          name: String(name).trim(),
          slug: String(slug).trim(),
          city: String(city).trim(),
        },
      });
    } catch {
      // Fallback to zero-config snapshot
    }

    const updatedStore = db.updateStoreSettings(session.storeId, {
      name: String(name),
      slug: String(slug),
      city: String(city),
      bannerUrl: bannerUrl ? String(bannerUrl) : undefined,
      description: description ? String(description) : undefined,
    });

    if (!updatedStore) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      store: updatedStore,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan profil toko." },
      { status: 500 }
    );
  }
}

