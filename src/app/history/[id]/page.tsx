"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";

interface CapitalCallDetail {
  id: string;
  capitalCallNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  investorEntityName: string | null;
  toRecipient: string | null;
  ccList: string | null;
  subjectRendered: string;
  bodyRenderedPlain: string;
  bodyRenderedHtml: string | null;
  wireSnapshot: string | null;
  memoOverride: string | null;
  createdAt: string;
  fund: { name: string };
  wireInstruction: { label: string };
  createdBy: { name: string | null; email: string };
}

export default function HistoryDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [record, setRecord] = useState<CapitalCallDetail | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/capital-calls/${params.id}`).then((r) => r.json()).then(setRecord);
  }, [session, params.id]);

  if (!session || !record) return <div className="p-4">Loading...</div>;

  const wireSnapshot = record.wireSnapshot ? JSON.parse(record.wireSnapshot) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/history" className="hover:text-gray-700">History</Link>
        <span>/</span>
        <span>Call #{record.capitalCallNumber}</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold mb-4">{record.fund.name} — Call #{record.capitalCallNumber}</h1>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
          <div><dt className="text-gray-500">Amount</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: record.currency }).format(record.amount)}</dd></div>
          <div><dt className="text-gray-500">Due Date</dt><dd>{new Date(record.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}</dd></div>
          <div><dt className="text-gray-500">Investor</dt><dd>{record.investorEntityName || "—"}</dd></div>
          <div><dt className="text-gray-500">Wire Used</dt><dd>{record.wireInstruction.label}</dd></div>
          <div><dt className="text-gray-500">To</dt><dd>{record.toRecipient || "—"}</dd></div>
          <div><dt className="text-gray-500">CC</dt><dd>{record.ccList || "—"}</dd></div>
          <div><dt className="text-gray-500">Created By</dt><dd>{record.createdBy.name || record.createdBy.email}</dd></div>
          <div><dt className="text-gray-500">Created At</dt><dd>{new Date(record.createdAt).toLocaleString()}</dd></div>
        </dl>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Subject</h2>
          <CopyButton text={record.subjectRendered} label="Copy Subject" />
        </div>
        <p className="text-sm font-medium">{record.subjectRendered}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Email Body</h2>
          <div className="flex gap-2">
            <CopyButton text={record.bodyRenderedPlain} label="Copy Plain Text" />
            {record.bodyRenderedHtml && <CopyButton text={record.bodyRenderedHtml} label="Copy HTML" />}
          </div>
        </div>
        <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
          {record.bodyRenderedPlain}
        </pre>
      </div>

      {wireSnapshot && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button onClick={() => setShowSnapshot(!showSnapshot)} className="font-semibold text-sm text-blue-600 hover:underline">
            {showSnapshot ? "Hide" : "Show"} Wire Snapshot (at time of generation)
          </button>
          {showSnapshot && (
            <pre className="mt-3 text-xs font-mono bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(wireSnapshot, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
