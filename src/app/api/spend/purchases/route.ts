import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParent } from "@/lib/parentAuth";
import { categorize, isCategory } from "@/lib/categorize";
import { convertToUSD, isCurrency } from "@/lib/currency";

// GET: with a kid token → that kid's purchases (for the kid's page).
//      with the parent cookie → all purchases, filterable by kid/category/date.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const token = sp.get("token");

  if (token) {
    const kid = await prisma.kid.findUnique({ where: { token } });
    if (!kid) return NextResponse.json({ error: "Unknown link" }, { status: 404 });
    const purchases = await prisma.purchase.findMany({
      where: { kidId: kid.id },
      orderBy: { purchasedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ kid: { name: kid.name, emoji: kid.emoji }, purchases });
  }

  if (!(await isParent())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, unknown> = {};
  if (sp.get("kidId")) where.kidId = sp.get("kidId");
  if (sp.get("category")) where.category = sp.get("category");
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(`${to}T23:59:59.999`);
    where.purchasedAt = range;
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { kid: { select: { id: true, name: true, emoji: true } } },
    orderBy: { purchasedAt: "desc" },
  });
  return NextResponse.json(purchases);
}

// POST: log a purchase. Authenticated by kid token — no login needed on the
// kid's phone. Auto-categorizes when no category is provided.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = (body.token || "").trim();
  const kid = await prisma.kid.findUnique({ where: { token } });
  if (!kid) return NextResponse.json({ error: "Unknown link" }, { status: 404 });

  const merchant = (body.merchant || "").trim();
  const entered = Math.round(parseFloat(body.amount) * 100) / 100;
  if (!merchant) return NextResponse.json({ error: "What did you buy / where?" }, { status: 400 });
  if (!isFinite(entered) || entered <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  // Foreign-currency entries are converted and stored in USD, keeping the
  // original amount alongside.
  const currency = isCurrency(body.currency) ? body.currency : "USD";
  const amount = currency === "USD" ? entered : await convertToUSD(entered, currency);
  const originalAmount = currency === "USD" ? null : entered;
  const originalCurrency = currency === "USD" ? null : currency;

  const description = (body.description || "").trim() || null;
  const category =
    body.category && isCategory(body.category)
      ? body.category
      : categorize(`${merchant} ${description || ""}`);

  const purchase = await prisma.purchase.create({
    data: {
      kidId: kid.id,
      merchant,
      description,
      amount,
      originalAmount,
      originalCurrency,
      category,
      source: body.source === "applepay" ? "applepay" : "manual",
    },
  });
  return NextResponse.json(purchase);
}
