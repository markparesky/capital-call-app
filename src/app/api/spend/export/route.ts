import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParent } from "@/lib/parentAuth";

// CSV export of purchases — open it in Excel/Numbers/Sheets and sort by the
// Child or Category column. Supports the same filters as the dashboard.
export async function GET(request: NextRequest) {
  if (!(await isParent())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
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
    include: { kid: { select: { name: true } } },
    orderBy: [{ kid: { name: "asc" } }, { purchasedAt: "desc" }],
  });

  const csv = [
    "Date,Time,Child,Store,Item,Category,Amount,Source",
    ...purchases.map((p) => {
      const d = p.purchasedAt;
      return [
        d.toISOString().slice(0, 10),
        d.toISOString().slice(11, 16),
        q(p.kid.name),
        q(p.merchant),
        q(p.description),
        q(p.category),
        p.amount.toFixed(2),
        p.source === "applepay" ? "Apple Pay" : "Manual",
      ].join(",");
    }),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=kids-spending-${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
}

function q(val: string | null | undefined): string {
  if (!val) return "";
  return `"${val.replace(/"/g, '""')}"`;
}
