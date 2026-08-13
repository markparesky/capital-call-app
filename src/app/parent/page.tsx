"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_EMOJI, type Category } from "@/lib/categorize";

interface Kid {
  id: string;
  name: string;
  emoji: string;
  token: string;
  _count: { purchases: number };
}

interface Purchase {
  id: string;
  merchant: string;
  description: string | null;
  amount: number;
  category: string;
  source: string;
  purchasedAt: string;
  kid: { id: string; name: string; emoji: string };
}

type SortKey = "purchasedAt" | "kid" | "merchant" | "category" | "amount";

export default function ParentPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [kids, setKids] = useState<Kid[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [kidFilter, setKidFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("purchasedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [showKids, setShowKids] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidEmoji, setNewKidEmoji] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  const filterQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (kidFilter) q.set("kidId", kidFilter);
    if (categoryFilter) q.set("category", categoryFilter);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return q.toString();
  }, [kidFilter, categoryFilter, from, to]);

  const loadKids = useCallback(async () => {
    const res = await fetch("/api/spend/kids");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setKids(await res.json());
  }, []);

  const loadPurchases = useCallback(async () => {
    const res = await fetch(`/api/spend/purchases?${filterQuery}`);
    if (!res.ok) return;
    setPurchases(await res.json());
  }, [filterQuery]);

  useEffect(() => {
    loadKids();
  }, [loadKids]);

  useEffect(() => {
    if (!authed) return;
    loadPurchases();
  }, [authed, loadPurchases]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/parent/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || "Login failed");
      return;
    }
    setPassword("");
    loadKids();
  };

  const sorted = useMemo(() => {
    const arr = [...purchases];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "amount":
          return (a.amount - b.amount) * dir;
        case "kid":
          return a.kid.name.localeCompare(b.kid.name) * dir;
        case "merchant":
          return a.merchant.localeCompare(b.merchant) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        default:
          return (new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()) * dir;
      }
    });
    return arr;
  }, [purchases, sortKey, sortDir]);

  const total = purchases.reduce((s, p) => s + p.amount, 0);

  const byKid = useMemo(() => {
    const m = new Map<string, { name: string; emoji: string; total: number; count: number }>();
    for (const p of purchases) {
      const e = m.get(p.kid.id) || { name: p.kid.name, emoji: p.kid.emoji, total: 0, count: 0 };
      e.total += p.amount;
      e.count += 1;
      m.set(p.kid.id, e);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [purchases]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of purchases) m.set(p.category, (m.get(p.category) || 0) + p.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [purchases]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "purchasedAt" || key === "amount" ? "desc" : "asc");
    }
  };

  const addKid = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/spend/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKidName, emoji: newKidEmoji }),
    });
    if (res.ok) {
      setNewKidName("");
      setNewKidEmoji("");
      loadKids();
    }
  };

  const deleteKid = async (kid: Kid) => {
    if (!confirm(`Delete ${kid.name} and all ${kid._count.purchases} of their purchases?`)) return;
    await fetch(`/api/spend/kids/${kid.id}`, { method: "DELETE" });
    loadKids();
    loadPurchases();
  };

  const copyLink = async (kid: Kid) => {
    await navigator.clipboard.writeText(`${window.location.origin}/k/${kid.token}`);
    setCopiedToken(kid.token);
    setTimeout(() => setCopiedToken(""), 2000);
  };

  const updateCategory = async (id: string, category: string) => {
    await fetch(`/api/spend/purchases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    loadPurchases();
  };

  const deletePurchase = async (id: string) => {
    if (!confirm("Delete this purchase?")) return;
    await fetch(`/api/spend/purchases/${id}`, { method: "DELETE" });
    loadPurchases();
  };

  if (authed === null) {
    return <div className="max-w-md mx-auto pt-20 text-center text-gray-400">Loading…</div>;
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto pt-20">
        <form
          onSubmit={login}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm"
        >
          <h1 className="text-lg font-bold text-center">Parent Dashboard</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            required
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Kids Spending</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKids(!showKids)}
            className="px-4 py-2 bg-white border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            {showKids ? "Hide Kids" : "Manage Kids"}
          </button>
          <a
            href={`/api/spend/export?${filterQuery}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Export CSV
          </a>
        </div>
      </div>

      {showKids && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <form onSubmit={addKid} className="flex gap-2 flex-wrap">
            <input
              value={newKidName}
              onChange={(e) => setNewKidName(e.target.value)}
              placeholder="Child's name"
              className="px-3 py-2 border border-gray-300 rounded text-sm"
              required
            />
            <input
              value={newKidEmoji}
              onChange={(e) => setNewKidEmoji(e.target.value)}
              placeholder="Emoji (optional)"
              className="px-3 py-2 border border-gray-300 rounded text-sm w-32"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Child
            </button>
          </form>
          <div className="space-y-2">
            {kids.map((kid) => (
              <div key={kid.id} className="flex items-center gap-3 text-sm border-t border-gray-100 pt-2 flex-wrap">
                <span className="text-lg">{kid.emoji}</span>
                <span className="font-medium w-28">{kid.name}</span>
                <span className="text-gray-400 text-xs">{kid._count.purchases} purchases</span>
                <button
                  onClick={() => copyLink(kid)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  {copiedToken === kid.token ? "Copied ✓" : "Copy their link"}
                </button>
                <a
                  href={`/k/${kid.token}`}
                  target="_blank"
                  className="text-blue-600 hover:underline text-xs"
                >
                  Open
                </a>
                <button
                  onClick={() => deleteKid(kid)}
                  className="text-red-500 hover:underline text-xs ml-auto"
                >
                  Delete
                </button>
              </div>
            ))}
            {kids.length === 0 && (
              <p className="text-sm text-gray-400 pt-1">
                No kids yet — add one above, then text them their personal link.
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Each child gets a private link — no account or password needed. They can add it to
            their Home Screen, and the ⚡ setup page on their link auto-logs Apple Pay purchases.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Total (filtered)</div>
          <div className="text-2xl font-bold">${total.toFixed(2)}</div>
          <div className="text-xs text-gray-400">{purchases.length} purchases</div>
        </div>
        {byKid.slice(0, 3).map((k) => (
          <div key={k.name} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500">
              {k.emoji} {k.name}
            </div>
            <div className="text-2xl font-bold">${k.total.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{k.count} purchases</div>
          </div>
        ))}
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-2">By category</div>
          <div className="flex flex-wrap gap-2">
            {byCategory.map(([cat, amt]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {CATEGORY_EMOJI[cat as Category] || "❓"} {cat} · ${amt.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={kidFilter}
          onChange={(e) => setKidFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">All kids</option>
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.emoji} {k.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
        />
        {(kidFilter || categoryFilter || from || to) && (
          <button
            onClick={() => {
              setKidFilter("");
              setCategoryFilter("");
              setFrom("");
              setTo("");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th onClick={() => toggleSort("purchasedAt")}>Date{arrow("purchasedAt")}</Th>
              <Th onClick={() => toggleSort("kid")}>Child{arrow("kid")}</Th>
              <Th onClick={() => toggleSort("merchant")}>Store / Item{arrow("merchant")}</Th>
              <Th onClick={() => toggleSort("category")}>Category{arrow("category")}</Th>
              <Th onClick={() => toggleSort("amount")}>Amount{arrow("amount")}</Th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(p.purchasedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {p.source === "applepay" && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                      Pay
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {p.kid.emoji} {p.kid.name}
                </td>
                <td className="px-4 py-3">
                  {p.merchant}
                  {p.description && <span className="text-gray-400"> — {p.description}</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.category}
                    onChange={(e) => updateCategory(p.id, e.target.value)}
                    className="border-0 bg-transparent text-sm cursor-pointer hover:text-blue-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_EMOJI[c]} {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">${p.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deletePurchase(p.id)}
                    className="text-gray-300 hover:text-red-500"
                    title="Delete"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No purchases yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-blue-600 whitespace-nowrap"
    >
      {children}
    </th>
  );
}
