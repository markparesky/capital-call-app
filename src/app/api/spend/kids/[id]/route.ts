import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParent } from "@/lib/parentAuth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isParent())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.kid.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
