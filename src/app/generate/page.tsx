"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { renderSubject, renderPlainText, renderHtml } from "@/lib/render";

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
  wireInstructions: Wire[];
  contacts: Contact[];
}

export default function GeneratePage() {
  const { data: session } = useSession();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFundId, setSelectedFundId] = useState("");
  const [selectedWireId, setSelectedWireId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [investorEntity, setInvestorEntity] = useState("");
  const [memoOverride, setMemoOverride] = useState("");
  const [toRecipient, setToRecipient] = useState("");
  const [ccList, setCcList] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nonDefaultWireConfirmed, setNonDefaultWireConfirmed] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/funds").then((r) => r.json()).then(setFunds);
  }, [session]);

  const filteredFunds = useMemo(() => {
    if (!search) return funds;
    const s = search.toLowerCase();
    return funds.filter((f) => f.name.toLowerCase().includes(s));
  }, [funds, search]);

  const selectedFund = funds.find((f) => f.id === selectedFundId);
  const activeWires = selectedFund?.wireInstructions.filter((w) => w.isActive) || [];
  const selectedWire = selectedFund?.wireInstructions.find((w) => w.id === selectedWireId);
  const defaultWire = activeWires[0];

  useEffect(() => {
    if (selectedFund) {
      setCurrency(selectedFund.defaultCurrency);
      if (defaultWire) {
        setSelectedWireId(defaultWire.id);
        setNonDefaultWireConfirmed(false);
        if (defaultWire.referenceInstructions) {
          setMemoOverride("");
        }
      }
      // Prefill To/CC from contacts
      const adminContacts = selectedFund.contacts.filter((c) => c.type === "admin");
      const otherContacts = selectedFund.contacts.filter((c) => c.type !== "admin");
      if (adminContacts.length > 0) setToRecipient(adminContacts[0].email);
      if (otherContacts.length > 0) setCcList(otherContacts.map((c) => c.email).join(", "));
    }
  }, [selectedFundId]);

  const handleWireChange = (wireId: string) => {
    if (defaultWire && wireId !== defaultWire.id && !nonDefaultWireConfirmed) {
      if (!confirm("You are switching away from the default wire instruction. Continue?")) return;
      setNonDefaultWireConfirmed(true);
    }
    setSelectedWireId(wireId);
  };

  const preview = useMemo(() => {
    if (!selectedFund || !selectedWire || !amount || !dueDate || !callNumber) return null;
    const input = {
      fundName: selectedFund.name,
      legalName: selectedFund.legalName,
      investorEntityName: investorEntity || null,
      capitalCallNumber: callNumber,
      amount: parseFloat(amount),
      currency,
      dueDate,
      wire: selectedWire,
      memoOverride: memoOverride || null,
      signature: null,
    };
    return {
      subject: renderSubject(input),
      body: renderPlainText(input),
      html: renderHtml(input),
    };
  }, [selectedFund, selectedWire, amount, currency, dueDate, callNumber, investorEntity, memoOverride]);

  const handleSave = async () => {
    if (!preview) return;
    const res = await fetch("/api/capital-calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fundId: selectedFundId,
        wireInstructionId: selectedWireId,
        investorEntityName: investorEntity,
        capitalCallNumber: callNumber,
        amount,
        currency,
        dueDate,
        memoOverride,
        toRecipient,
        ccList,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Generate Capital Call Email</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Fund Search */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Fund *</label>
            <input
              type="text"
              value={selectedFund ? selectedFund.name : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedFundId("");
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Search funds..."
            />
            {showDropdown && !selectedFundId && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                {filteredFunds.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFundId(f.id);
                      setSearch("");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                  >
                    {f.name}
                    {f.legalName && <span className="text-gray-400 ml-2">({f.legalName})</span>}
                  </button>
                ))}
                {filteredFunds.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No funds found</div>
                )}
              </div>
            )}
            {selectedFundId && (
              <button
                onClick={() => { setSelectedFundId(""); setSearch(""); setSelectedWireId(""); }}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 text-sm"
              >
                clear
              </button>
            )}
          </div>

          {/* Wire Instruction */}
          {selectedFund && (
            <div>
              <label className="block text-sm font-medium mb-1">Wire Instruction *</label>
              <select
                value={selectedWireId}
                onChange={(e) => handleWireChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Select wire instruction</option>
                {activeWires.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} ({w.beneficiaryName}){w.id === defaultWire?.id ? " [DEFAULT]" : ""}
                  </option>
                ))}
              </select>
              {selectedWire && selectedWire.verificationStatus === "unverified" && (
                <p className="text-xs text-yellow-600 mt-1">Warning: This wire instruction is unverified.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="1000000.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capital Call # *</label>
              <input
                value={callNumber}
                onChange={(e) => setCallNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Investor Entity Name</label>
            <input
              value={investorEntity}
              onChange={(e) => setInvestorEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reference/Memo
              {selectedWire?.referenceInstructions && (
                <span className="text-gray-400 font-normal ml-1">(default: {selectedWire.referenceInstructions})</span>
              )}
            </label>
            <input
              value={memoOverride}
              onChange={(e) => setMemoOverride(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder={selectedWire?.referenceInstructions || "Optional memo"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">To (recipient email)</label>
              <input
                value={toRecipient}
                onChange={(e) => setToRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CC (comma-separated)</label>
              <input
                value={ccList}
                onChange={(e) => setCcList(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Preview</h2>
          {(() => {
            const missing: string[] = [];
            if (!selectedFund) missing.push("Fund");
            if (!selectedWire) missing.push("Wire Instruction");
            if (!amount) missing.push("Amount");
            if (!dueDate) missing.push("Due Date");
            if (!callNumber) missing.push("Capital Call #");
            return missing.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm space-y-2">
                <p className="text-gray-500">Fill in the required fields to generate the email:</p>
                <p className="text-red-500 font-medium">{missing.join(", ")}</p>
              </div>
            ) : null;
          })()}
          {preview ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <CopyButton text={preview.subject} label="Copy Subject" />
                </div>
                <p className="text-sm font-medium">{preview.subject}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-500">Email Body (Plain Text)</label>
                  <CopyButton text={preview.body} label="Copy Body" />
                </div>
                <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                  {preview.body}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  {saved ? "Saved!" : "Save to History"}
                </button>
                <CopyButton text={preview.html} label="Copy HTML" />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
