"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Nav() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-gray-900">
            Capital Call Manager
          </Link>
          <Link href="/funds" className="text-sm text-gray-600 hover:text-gray-900">
            Funds
          </Link>
          <Link href="/generate" className="text-sm text-gray-600 hover:text-gray-900">
            Generate Email
          </Link>
          <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
            History
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            {session.user.email}
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
              {session.user.role}
            </span>
          </span>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
