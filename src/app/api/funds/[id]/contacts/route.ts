import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const contact = await prisma.contact.create({
    data: {
      fundId: id,
      name: body.name,
      email: body.email,
      type: body.type || "admin",
    },
  });

  return NextResponse.json(contact, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await params;
  const contactId = request.nextUrl.searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ error: "Missing contactId" }, { status: 400 });

  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}
