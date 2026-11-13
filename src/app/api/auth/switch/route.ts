import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  getDemoAccountByKey,
  getCurrentSession,
} from "@/lib/auth";

export async function GET() {
  const session = getCurrentSession();
  return NextResponse.json({ session });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const account = getDemoAccountByKey(body.roleKey);

    const response = NextResponse.json({
      success: true,
      session: account,
      redirectTo: account.defaultRedirect,
    });

    response.cookies.set(DEMO_SESSION_COOKIE, account.key, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to switch role" },
      { status: 400 }
    );
  }
}

