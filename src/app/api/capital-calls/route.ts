import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { renderSubject, renderPlainText, renderHtml } from "@/lib/render";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fundId = request.nextUrl.searchParams.get("fundId");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (fundId) where.fundId = fundId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  const calls = await prisma.capitalCallRequest.findMany({
    where,
    include: { fund: true, createdBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(calls);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const fund = await prisma.fund.findUnique({ where: { id: body.fundId } });
  if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });

  const wire = await prisma.wireInstruction.findUnique({
    where: { id: body.wireInstructionId },
  });
  if (!wire) return NextResponse.json({ error: "Wire not found" }, { status: 404 });

  const renderInput = {
    fundName: fund.name,
    legalName: fund.legalName,
    investorEntityName: body.investorEntityName || null,
    capitalCallNumber: body.capitalCallNumber,
    amount: parseFloat(body.amount),
    currency: body.currency || fund.defaultCurrency,
    dueDate: body.dueDate,
    wire: {
      beneficiaryName: wire.beneficiaryName,
      beneficiaryAddress: wire.beneficiaryAddress,
      bankName: wire.bankName,
      bankAddress: wire.bankAddress,
      abaRouting: wire.abaRouting,
      accountNumber: wire.accountNumber,
      swift: wire.swift,
      iban: wire.iban,
      forFurtherCredit: wire.forFurtherCredit,
      referenceInstructions: wire.referenceInstructions,
      remittanceEmail: wire.remittanceEmail,
    },
    memoOverride: body.memoOverride || null,
    signature: body.signature || null,
  };

  const subject = renderSubject(renderInput);
  const plainText = renderPlainText(renderInput);
  const html = renderHtml(renderInput);

  const record = await prisma.capitalCallRequest.create({
    data: {
      fundId: body.fundId,
      wireInstructionId: body.wireInstructionId,
      investorEntityName: body.investorEntityName || null,
      capitalCallNumber: body.capitalCallNumber,
      amount: parseFloat(body.amount),
      currency: body.currency || fund.defaultCurrency,
      dueDate: new Date(body.dueDate),
      memoOverride: body.memoOverride || null,
      ccList: body.ccList || null,
      toRecipient: body.toRecipient || null,
      subjectRendered: subject,
      bodyRenderedPlain: plainText,
      bodyRenderedHtml: html,
      wireSnapshot: JSON.stringify(wire),
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json(
    { ...record, subjectRendered: subject, bodyRenderedPlain: plainText, bodyRenderedHtml: html },
    { status: 201 }
  );
}
