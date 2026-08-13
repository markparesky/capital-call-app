import { NextRequest, NextResponse } from "next/server";
import { expectedToken, PARENT_COOKIE } from "@/lib/parentAuth";

export async function POST(request: NextRequest) {
  const expected = expectedToken();
  if (!expected) {
    return NextResponse.json(
      { error: "PARENT_PASSWORD is not configured on the server" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body.password !== process.env.PARENT_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARENT_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
