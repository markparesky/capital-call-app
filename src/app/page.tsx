import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/funds"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg mb-2">Funds</h2>
          <p className="text-gray-600 text-sm">
            Manage funds and wire instructions
          </p>
        </Link>
        <Link
          href="/generate"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg mb-2">Generate Email</h2>
          <p className="text-gray-600 text-sm">
            Create a capital call email with wire instructions
          </p>
        </Link>
        <Link
          href="/history"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg mb-2">History</h2>
          <p className="text-gray-600 text-sm">
            View past generated capital call requests
          </p>
        </Link>
      </div>
      {session.user.role === "admin" && (
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3">Admin: Export Data</h3>
          <div className="flex gap-3">
            <a
              href="/api/export?type=funds"
              className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Export Funds CSV
            </a>
            <a
              href="/api/export?type=wires"
              className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Export Wires CSV
            </a>
            <a
              href="/api/export?type=requests"
              className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Export Requests CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
