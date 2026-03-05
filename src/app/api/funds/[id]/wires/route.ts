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
  const wires = await prisma.wireInstruction.findMany({
    where: { fundId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(wires);
}

export async function POST(
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

  const wire = await prisma.wireInstruction.create({
    data: {
      fundId: id,
      label: body.label,
      beneficiaryName: body.beneficiaryName,
      beneficiaryAddress: body.beneficiaryAddress || null,
      bankName: body.bankName,
      bankAddress: body.bankAddress || null,
      abaRouting: body.abaRouting || null,
      accountNumber: body.accountNumber || null,
      swift: body.swift || null,
      iban: body.iban || null,
      forFurtherCredit: body.forFurtherCredit || null,
      referenceInstructions: body.referenceInstructions || null,
      remittanceEmail: body.remittanceEmail || null,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(wire, { status: 201 });
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

  const body = await request.json();
  const wireId = body.wireId;

  if (body.action === "deactivate") {
    await prisma.wireInstruction.update({
      where: { id: wireId },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "verify") {
    await prisma.wireInstruction.update({
      where: { id: wireId },
      data: {
        verificationStatus: "verified",
        lastVerifiedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  }

  // Update wire
  const wire = await prisma.wireInstruction.update({
    where: { id: wireId },
    data: {
      label: body.label,
      beneficiaryName: body.beneficiaryName,
      beneficiaryAddress: body.beneficiaryAddress || null,
      bankName: body.bankName,
      bankAddress: body.bankAddress || null,
      abaRouting: body.abaRouting || null,
      accountNumber: body.accountNumber || null,
      swift: body.swift || null,
      iban: body.iban || null,
      forFurtherCredit: body.forFurtherCredit || null,
      referenceInstructions: body.referenceInstructions || null,
      remittanceEmail: body.remittanceEmail || null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(wire);
}
