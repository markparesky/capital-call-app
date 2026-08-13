import { createHash } from "crypto";
import { cookies } from "next/headers";

// Single-password parent auth: the dashboard cookie holds a hash derived from
// PARENT_PASSWORD, so changing the env var invalidates existing sessions.
export const PARENT_COOKIE = "parent_auth";

export function expectedToken(): string | null {
  const password = process.env.PARENT_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`kids-spending:${password}`).digest("hex");
}

export async function isParent(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const store = await cookies();
  return store.get(PARENT_COOKIE)?.value === expected;
}
