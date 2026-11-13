import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db, prisma } from "@/lib/prisma";
import { RoleType } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya SUPERADMIN yang dapat mengelola role user." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, name, email } = body as {
      userId: string;
      role?: RoleType;
      name?: string;
      email?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId wajib diisi." },
        { status: 400 }
      );
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(role ? { role } : {}),
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
        },
      });
    } catch {
      // Fallback to persistent snapshot when local MySQL is offline
    }

    const updatedUser = db.updateUserRoleAndProfile({
      userId,
      role,
      name,
      email,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      users: db.getAllUsers(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui akun pengguna." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya SUPERADMIN yang dapat menambah pengguna." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role } = body as {
      name: string;
      email: string;
      role: RoleType;
    };

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Nama, email, dan role wajib diisi." },
        { status: 400 }
      );
    }

    const newUser = db.createUser({ name, email, role });

    try {
      await prisma.user.create({
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
        },
      });
    } catch {
      // Fallback to persistent snapshot when local MySQL is offline
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      users: db.getAllUsers(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat akun pengguna baru." },
      { status: 500 }
    );
  }
}

