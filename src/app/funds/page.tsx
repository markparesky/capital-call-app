"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Fund {
  id: string;
  name: string;
  legalName: string | null;
  defaultCurrency: string;
  status: string;
  wireInstructions: { id: string; isActive: boolean }[];
}

export default function FundsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", legalName: "", defaultCurrency: "USD", notes: "" });

  useEffect(() => {
    if (!session) return;
    fetch(`/api/funds?query=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setFunds);
  }, [session, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const fund = await res.json();
      router.push(`/funds/${fund.id}`);
    }
  };

  if (!session) return null;

  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Funds</h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {showCreate ? "Cancel" : "New Fund"}
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Legal Name</label>
              <input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Currency</label>
              <input
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Create Fund
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search funds..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Legal Name</th>
              <th className="text-left px-4 py-3 font-medium">Currency</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Active Wires</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund) => (
              <tr key={fund.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/funds/${fund.id}`} className="text-blue-600 hover:underline">
                    {fund.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{fund.legalName || "—"}</td>
                <td className="px-4 py-3">{fund.defaultCurrency}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${fund.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {fund.status}
                  </span>
                </td>
                <td className="px-4 py-3">{fund.wireInstructions.filter((w) => w.isActive).length}</td>
              </tr>
            ))}
            {funds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No funds found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
