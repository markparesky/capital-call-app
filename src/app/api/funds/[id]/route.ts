import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: {
      wireInstructions: { orderBy: { createdAt: "desc" } },
      contacts: true,
    },
  });

  if (!fund) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(fund);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const fund = await prisma.fund.update({
    where: { id },
    data: {
      name: body.name,
      legalName: body.legalName,
      defaultCurrency: body.defaultCurrency,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(fund);
}
