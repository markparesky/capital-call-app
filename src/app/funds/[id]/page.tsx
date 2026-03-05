"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Wire {
  id: string;
  label: string;
  beneficiaryName: string;
  beneficiaryAddress: string | null;
  bankName: string;
  bankAddress: string | null;
  abaRouting: string | null;
  accountNumber: string | null;
  swift: string | null;
  iban: string | null;
  forFurtherCredit: string | null;
  referenceInstructions: string | null;
  remittanceEmail: string | null;
  isActive: boolean;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface Fund {
  id: string;
  name: string;
  legalName: string | null;
  defaultCurrency: string;
  status: string;
  notes: string | null;
  wireInstructions: Wire[];
  contacts: Contact[];
}

const emptyWire = {
  label: "",
  beneficiaryName: "",
  beneficiaryAddress: "",
  bankName: "",
  bankAddress: "",
  abaRouting: "",
  accountNumber: "",
  swift: "",
  iban: "",
  forFurtherCredit: "",
  referenceInstructions: "",
  remittanceEmail: "",
};

export default function FundDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [fund, setFund] = useState<Fund | null>(null);
  const [showWireForm, setShowWireForm] = useState(false);
  const [wireForm, setWireForm] = useState(emptyWire);
  const [editFund, setEditFund] = useState(false);
  const [fundForm, setFundForm] = useState({ name: "", legalName: "", defaultCurrency: "", status: "", notes: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", type: "admin" });
  const [showContactForm, setShowContactForm] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  const loadFund = () => {
    fetch(`/api/funds/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setFund(data);
        setFundForm({
          name: data.name,
          legalName: data.legalName || "",
          defaultCurrency: data.defaultCurrency,
          status: data.status,
          notes: data.notes || "",
        });
      });
  };

  useEffect(() => {
    if (session) loadFund();
  }, [session, params.id]);

  const handleAddWire = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/funds/${params.id}/wires`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wireForm),
    });
    if (res.ok) {
      setWireForm(emptyWire);
      setShowWireForm(false);
      loadFund();
    }
  };

  const handleWireAction = async (wireId: string, action: string) => {
    if (action === "deactivate" && !confirm("Deactivate this wire instruction?")) return;
    await fetch(`/api/funds/${params.id}/wires`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wireId, action }),
    });
    loadFund();
  };

  const handleUpdateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/funds/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fundForm),
    });
    setEditFund(false);
    loadFund();
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/funds/${params.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setContactForm({ name: "", email: "", type: "admin" });
    setShowContactForm(false);
    loadFund();
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Remove this contact?")) return;
    await fetch(`/api/funds/${params.id}/contacts?contactId=${contactId}`, {
      method: "DELETE",
    });
    loadFund();
  };

  if (!session || !fund) return <div className="p-4">Loading...</div>;

  const staleThresholdDays = 90;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/funds" className="hover:text-gray-700">Funds</Link>
        <span>/</span>
        <span>{fund.name}</span>
      </div>

      {/* Fund Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{fund.name}</h1>
          {isAdmin && (
            <button
              onClick={() => setEditFund(!editFund)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {editFund ? "Cancel" : "Edit"}
            </button>
          )}
        </div>

        {editFund ? (
          <form onSubmit={handleUpdateFund} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={fundForm.name} onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Legal Name</label>
                <input value={fundForm.legalName} onChange={(e) => setFundForm({ ...fundForm, legalName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <input value={fundForm.defaultCurrency} onChange={(e) => setFundForm({ ...fundForm, defaultCurrency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={fundForm.status} onChange={(e) => setFundForm({ ...fundForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={fundForm.notes} onChange={(e) => setFundForm({ ...fundForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows={2} />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Save</button>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-gray-500">Legal Name</dt><dd>{fund.legalName || "—"}</dd></div>
            <div><dt className="text-gray-500">Currency</dt><dd>{fund.defaultCurrency}</dd></div>
            <div><dt className="text-gray-500">Status</dt><dd><span className={`px-2 py-0.5 rounded text-xs ${fund.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{fund.status}</span></dd></div>
            <div><dt className="text-gray-500">Notes</dt><dd>{fund.notes || "—"}</dd></div>
          </dl>
        )}
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Contacts</h2>
          {isAdmin && (
            <button onClick={() => setShowContactForm(!showContactForm)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
              {showContactForm ? "Cancel" : "Add Contact"}
            </button>
          )}
        </div>
        {showContactForm && (
          <form onSubmit={handleAddContact} className="mb-4 p-3 bg-gray-50 rounded space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" required />
              <input placeholder="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" required />
              <select value={contactForm.type} onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="admin">Admin</option>
                <option value="remittance">Remittance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Add</button>
          </form>
        )}
        {fund.contacts.length === 0 ? (
          <p className="text-gray-500 text-sm">No contacts</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {fund.contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1">
                <span>{c.name} &lt;{c.email}&gt; <span className="text-gray-400">({c.type})</span></span>
                {isAdmin && (
                  <button onClick={() => handleDeleteContact(c.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Wire Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Wire Instructions</h2>
          {isAdmin && (
            <button onClick={() => setShowWireForm(!showWireForm)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              {showWireForm ? "Cancel" : "Add Wire Instruction"}
            </button>
          )}
        </div>

        {showWireForm && (
          <form onSubmit={handleAddWire} className="mb-6 p-4 bg-gray-50 rounded space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Label *</label>
                <input value={wireForm.label} onChange={(e) => setWireForm({ ...wireForm, label: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" required placeholder='e.g. "Standard USD Wires"' />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Beneficiary Name *</label>
                <input value={wireForm.beneficiaryName} onChange={(e) => setWireForm({ ...wireForm, beneficiaryName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Beneficiary Address</label>
                <input value={wireForm.beneficiaryAddress} onChange={(e) => setWireForm({ ...wireForm, beneficiaryAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Bank Name *</label>
                <input value={wireForm.bankName} onChange={(e) => setWireForm({ ...wireForm, bankName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Bank Address</label>
                <input value={wireForm.bankAddress} onChange={(e) => setWireForm({ ...wireForm, bankAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ABA/Routing #</label>
                <input value={wireForm.abaRouting} onChange={(e) => setWireForm({ ...wireForm, abaRouting: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Account #</label>
                <input value={wireForm.accountNumber} onChange={(e) => setWireForm({ ...wireForm, accountNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SWIFT</label>
                <input value={wireForm.swift} onChange={(e) => setWireForm({ ...wireForm, swift: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">IBAN</label>
                <input value={wireForm.iban} onChange={(e) => setWireForm({ ...wireForm, iban: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">For Further Credit</label>
                <input value={wireForm.forFurtherCredit} onChange={(e) => setWireForm({ ...wireForm, forFurtherCredit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reference/Memo Instructions</label>
                <input value={wireForm.referenceInstructions} onChange={(e) => setWireForm({ ...wireForm, referenceInstructions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Remittance Email</label>
                <input value={wireForm.remittanceEmail} onChange={(e) => setWireForm({ ...wireForm, remittanceEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" type="email" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Create Wire Instruction</button>
          </form>
        )}

        <div className="space-y-4">
          {fund.wireInstructions.length === 0 ? (
            <p className="text-gray-500 text-sm">No wire instructions</p>
          ) : (
            fund.wireInstructions.map((wire) => {
              const isStale = wire.verificationStatus === "verified" && wire.lastVerifiedAt &&
                (Date.now() - new Date(wire.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24) > staleThresholdDays;
              return (
                <div key={wire.id} className={`p-4 rounded border ${wire.isActive ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wire.label}</span>
                      {wire.isActive && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Active</span>}
                      {!wire.isActive && <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">Inactive</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${wire.verificationStatus === "verified" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {wire.verificationStatus}
                      </span>
                      {isStale && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Verification stale</span>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        {wire.isActive && wire.verificationStatus !== "verified" && (
                          <button onClick={() => handleWireAction(wire.id, "verify")} className="text-xs text-blue-600 hover:underline">Mark Verified</button>
                        )}
                        {wire.isActive && (
                          <button onClick={() => handleWireAction(wire.id, "deactivate")} className="text-xs text-red-600 hover:underline">Deactivate</button>
                        )}
                      </div>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><dt className="text-gray-500 inline">Beneficiary:</dt> <dd className="inline">{wire.beneficiaryName}</dd></div>
                    <div><dt className="text-gray-500 inline">Bank:</dt> <dd className="inline">{wire.bankName}</dd></div>
                    {wire.abaRouting && <div><dt className="text-gray-500 inline">ABA:</dt> <dd className="inline">{wire.abaRouting}</dd></div>}
                    {wire.accountNumber && <div><dt className="text-gray-500 inline">Account:</dt> <dd className="inline">{wire.accountNumber}</dd></div>}
                    {wire.swift && <div><dt className="text-gray-500 inline">SWIFT:</dt> <dd className="inline">{wire.swift}</dd></div>}
                    {wire.iban && <div><dt className="text-gray-500 inline">IBAN:</dt> <dd className="inline">{wire.iban}</dd></div>}
                    {wire.forFurtherCredit && <div><dt className="text-gray-500 inline">FFC:</dt> <dd className="inline">{wire.forFurtherCredit}</dd></div>}
                    {wire.referenceInstructions && <div className="col-span-2"><dt className="text-gray-500 inline">Reference:</dt> <dd className="inline">{wire.referenceInstructions}</dd></div>}
                    {wire.remittanceEmail && <div className="col-span-2"><dt className="text-gray-500 inline">Remittance Email:</dt> <dd className="inline">{wire.remittanceEmail}</dd></div>}
                  </dl>
                  <p className="text-xs text-gray-400 mt-2">Created: {new Date(wire.createdAt).toLocaleDateString()}{wire.lastVerifiedAt ? ` | Verified: ${new Date(wire.lastVerifiedAt).toLocaleDateString()}` : ""}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
