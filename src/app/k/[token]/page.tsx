"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CATEGORY_EMOJI, categorize, type Category } from "@/lib/categorize";

interface Purchase {
  id: string;
  merchant: string;
  description: string | null;
  amount: number;
  category: string;
  source: string;
  purchasedAt: string;
  createdAt: string;
}

const KID_EDIT_WINDOW_MS = 60 * 60 * 1000;

export default function KidLogPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [kidName, setKidName] = useState<string | null>(null);
  const [kidEmoji, setKidEmoji] = useState("🙂");
  const [notFound, setNotFound] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [manualCategory, setManualCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/spend/purchases?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setKidName(data.kid.name);
    setKidEmoji(data.kid.emoji);
    setPurchases(data.purchases);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const autoCategory = useMemo(
    () => (merchant.trim() ? categorize(merchant) : null),
    [merchant]
  );
  const category = manualCategory || autoCategory;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/spend/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        merchant,
        amount,
        category: manualCategory || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — try again");
      return;
    }
    setAmount("");
    setMerchant("");
    setManualCategory(null);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    amountRef.current?.focus();
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/spend/purchases/${id}?token=${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
    load();
  };

  if (notFound) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center text-gray-500">
        This link isn&apos;t active. Ask your parent for a new one.
      </div>
    );
  }

  if (kidName === null) {
    return <div className="max-w-md mx-auto pt-20 text-center text-gray-400">Loading…</div>;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPurchases = purchases.filter((p) => new Date(p.purchasedAt) >= monthStart);
  const monthTotal = monthPurchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-md mx-auto space-y-5 pb-16">
      <div className="text-center pt-2">
        <div className="text-4xl">{kidEmoji}</div>
        <h1 className="text-xl font-bold">Hey {kidName}!</h1>
        <p className="text-sm text-gray-500">Just bought something? Log it — takes 5 seconds.</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">How much?</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full pl-10 pr-4 py-3 text-2xl font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Where, or what?</label>
          <input
            type="text"
            placeholder="Chipotle, Uber, Amazon…"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value);
              setManualCategory(null);
            }}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {category && (
          <div className="text-sm text-gray-600">
            Category:{" "}
            <span className="font-medium">
              {CATEGORY_EMOJI[category]} {category}
            </span>
            {!manualCategory && <span className="text-gray-400"> (auto — tap below to change)</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setManualCategory(c === manualCategory ? null : c)}
              className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${
                category === c
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {CATEGORY_EMOJI[c]} {c}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : justSaved ? "✓ Logged!" : "Log it"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">This month</h2>
          <span className="text-xl font-bold">${monthTotal.toFixed(2)}</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {purchases.slice(0, 20).map((p) => {
            const deletable = Date.now() - new Date(p.createdAt).getTime() < KID_EDIT_WINDOW_MS;
            return (
              <li key={p.id} className="py-2.5 flex items-center gap-3">
                <span className="text-xl">{CATEGORY_EMOJI[p.category as Category] || "❓"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.merchant}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(p.purchasedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {p.source === "applepay" && "  Apple Pay"}
                  </div>
                </div>
                <span className="text-sm font-semibold">${p.amount.toFixed(2)}</span>
                {deletable && (
                  <button
                    onClick={() => remove(p.id)}
                    className="text-gray-300 hover:text-red-500 text-lg px-1"
                    title="Delete (only works for the first hour)"
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
          {purchases.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-400">Nothing logged yet</li>
          )}
        </ul>
      </div>

      <div className="text-center">
        <Link href={`/k/${token}/setup`} className="text-sm text-blue-600 hover:underline">
          ⚡ Make Apple Pay purchases log themselves →
        </Link>
      </div>
    </div>
  );
}
