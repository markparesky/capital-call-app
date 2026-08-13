import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParent } from "@/lib/parentAuth";
import { isCategory } from "@/lib/categorize";

// A kid may fix or delete their own entry within this window (fat-finger fixes);
// the parent can always edit/delete.
const KID_EDIT_WINDOW_MS = 60 * 60 * 1000;

async function canTouch(request: NextRequest, purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { kid: true },
  });
  if (!purchase) return { purchase: null, allowed: false };

  if (await isParent()) return { purchase, allowed: true };

  const token = request.nextUrl.searchParams.get("token");
  const recent = Date.now() - purchase.createdAt.getTime() < KID_EDIT_WINDOW_MS;
  const allowed = !!token && purchase.kid.token === token && recent;
  return { purchase, allowed };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { purchase, allowed } = await canTouch(request, id);
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.category && isCategory(body.category)) data.category = body.category;
  if (typeof body.merchant === "string" && body.merchant.trim()) data.merchant = body.merchant.trim();
  if (body.amount !== undefined) {
    const amount = Math.round(parseFloat(body.amount) * 100) / 100;
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    data.amount = amount;
  }

  const updated = await prisma.purchase.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { purchase, allowed } = await canTouch(request, id);
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.purchase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
