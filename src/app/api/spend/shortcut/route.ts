import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorize } from "@/lib/categorize";

// Endpoint for the iOS Shortcuts "Transaction" automation (Apple Pay auto-log).
// Deliberately lenient: accepts JSON, form data, or plain query params, and
// tolerates currency-formatted amounts like "$12.34", so the Shortcut can be
// as simple as possible.

async function extract(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  let token = sp.get("token") || "";
  let merchant = sp.get("merchant") || sp.get("name") || "";
  let rawAmount = sp.get("amount") || "";

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const body = await request.json();
        token = body.token || token;
        merchant = body.merchant || body.name || merchant;
        rawAmount = body.amount != null ? String(body.amount) : rawAmount;
      } else if (contentType.includes("form")) {
        const form = await request.formData();
        token = (form.get("token") as string) || token;
        merchant = (form.get("merchant") as string) || (form.get("name") as string) || merchant;
        rawAmount = (form.get("amount") as string) || rawAmount;
      }
    } catch {
      // fall back to whatever the query params gave us
    }
  }
  return { token: token.trim(), merchant: merchant.trim(), rawAmount: rawAmount.trim() };
}

async function handle(request: NextRequest) {
  const { token, merchant, rawAmount } = await extract(request);

  const kid = await prisma.kid.findUnique({ where: { token } });
  if (!kid) return NextResponse.json({ ok: false, error: "Unknown token" }, { status: 404 });

  // Strip currency symbols/commas; Shortcuts passes amounts like "$12.34".
  const amount = Math.round(parseFloat(rawAmount.replace(/[^0-9.\-]/g, "")) * 100) / 100;
  if (!merchant || !isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { ok: false, error: "Need merchant and a positive amount" },
      { status: 400 }
    );
  }

  const purchase = await prisma.purchase.create({
    data: {
      kidId: kid.id,
      merchant,
      amount,
      category: categorize(merchant),
      source: "applepay",
    },
  });

  return NextResponse.json({
    ok: true,
    logged: `${kid.name}: ${merchant} $${amount.toFixed(2)} → ${purchase.category}`,
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
