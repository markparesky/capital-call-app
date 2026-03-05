"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CapitalCall {
  id: string;
  capitalCallNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  investorEntityName: string | null;
  createdAt: string;
  fund: { name: string };
  createdBy: { name: string | null; email: string };
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [calls, setCalls] = useState<CapitalCall[]>([]);
  const [fundFilter, setFundFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!session) return;
    const params = new URLSearchParams();
    if (fundFilter) params.set("fundId", fundFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/capital-calls?${params}`).then((r) => r.json()).then(setCalls);
  }, [session, fundFilter, from, to]);

  if (!session) return null;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        {(from || to || fundFilter) && (
          <button onClick={() => { setFrom(""); setTo(""); setFundFilter(""); }} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Fund</th>
              <th className="text-left px-4 py-3 font-medium">Call #</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Due Date</th>
              <th className="text-left px-4 py-3 font-medium">Investor</th>
              <th className="text-left px-4 py-3 font-medium">Created By</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/history/${c.id}`} className="text-blue-600 hover:underline">
                    {c.fund.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.capitalCallNumber}</td>
                <td className="px-4 py-3">{formatCurrency(c.amount, c.currency)}</td>
                <td className="px-4 py-3">{new Date(c.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}</td>
                <td className="px-4 py-3 text-gray-600">{c.investorEntityName || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.createdBy.name || c.createdBy.email}</td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No capital call requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
