import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("query") || "";
  const funds = await prisma.fund.findMany({
    where: query
      ? { name: { contains: query } }
      : undefined,
    include: {
      wireInstructions: { where: { isActive: true } },
      contacts: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(funds);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const fund = await prisma.fund.create({
    data: {
      name: body.name,
      legalName: body.legalName || null,
      defaultCurrency: body.defaultCurrency || "USD",
      status: body.status || "active",
      notes: body.notes || null,
    },
  });

  return NextResponse.json(fund, { status: 201 });
}
