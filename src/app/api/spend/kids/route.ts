import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParent } from "@/lib/parentAuth";
import { randomUUID } from "crypto";

export async function GET() {
  if (!(await isParent())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kids = await prisma.kid.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { purchases: true } } },
  });
  return NextResponse.json(kids);
}

export async function POST(request: NextRequest) {
  if (!(await isParent())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const kid = await prisma.kid.create({
    data: {
      name,
      emoji: (body.emoji || "🙂").trim() || "🙂",
      token: randomUUID().replace(/-/g, "").slice(0, 16),
    },
  });
  return NextResponse.json(kid);
}
