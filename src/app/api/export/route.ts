import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") || "funds";

  if (type === "funds") {
    const funds = await prisma.fund.findMany({ orderBy: { name: "asc" } });
    const csv = [
      "id,name,legalName,defaultCurrency,status,notes,createdAt",
      ...funds.map((f) =>
        [f.id, q(f.name), q(f.legalName), f.defaultCurrency, f.status, q(f.notes), f.createdAt.toISOString()].join(",")
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=funds.csv",
      },
    });
  }

  if (type === "wires") {
    const wires = await prisma.wireInstruction.findMany({
      include: { fund: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const csv = [
      "id,fundName,label,beneficiaryName,bankName,abaRouting,accountNumber,swift,iban,isActive,verificationStatus,createdAt",
      ...wires.map((w) =>
        [w.id, q(w.fund.name), q(w.label), q(w.beneficiaryName), q(w.bankName), w.abaRouting, w.accountNumber, w.swift, w.iban, w.isActive, w.verificationStatus, w.createdAt.toISOString()].join(",")
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=wires.csv",
      },
    });
  }

  if (type === "requests") {
    const requests = await prisma.capitalCallRequest.findMany({
      include: { fund: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const csv = [
      "id,fundName,capitalCallNumber,amount,currency,dueDate,investorEntityName,createdAt",
      ...requests.map((r) =>
        [r.id, q(r.fund.name), r.capitalCallNumber, r.amount, r.currency, r.dueDate.toISOString(), q(r.investorEntityName), r.createdAt.toISOString()].join(",")
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=capital-call-requests.csv",
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

function q(val: string | null | undefined): string {
  if (!val) return "";
  return `"${val.replace(/"/g, '""')}"`;
}
