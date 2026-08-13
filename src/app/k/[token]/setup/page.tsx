"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

export default function SetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shortcutUrl = `${origin}/api/spend/shortcut?token=${token}`;

  const copy = async () => {
    await navigator.clipboard.writeText(shortcutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-16">
      <div>
        <Link href={`/k/${token}`} className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
        <h1 className="text-xl font-bold mt-2">⚡ Set up auto-logging</h1>
        <p className="text-sm text-gray-500 mt-1">
          One-time setup, about 2 minutes. After this, every Apple Pay purchase logs itself —
          you never have to type anything.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
        <h2 className="font-semibold">Step 1 — Add this app to your Home Screen</h2>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>
            Open your personal link in <span className="font-medium">Safari</span>
          </li>
          <li>Tap the Share button (square with arrow)</li>
          <li>
            Tap <span className="font-medium">Add to Home Screen</span>
          </li>
        </ol>
        <p className="text-xs text-gray-400">
          Now it opens like a normal app for the times you pay with the physical card or cash.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
        <h2 className="font-semibold">Step 2 — Auto-log Apple Pay</h2>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>
            Open the <span className="font-medium">Shortcuts</span> app
          </li>
          <li>
            Go to <span className="font-medium">Automation</span> tab → tap{" "}
            <span className="font-medium">+</span> (New Automation)
          </li>
          <li>
            Choose <span className="font-medium">Transaction</span>
          </li>
          <li>
            Select the card you use, and pick{" "}
            <span className="font-medium">Run Immediately</span> → Next
          </li>
          <li>
            Tap <span className="font-medium">New Blank Automation</span>, then add the action{" "}
            <span className="font-medium">Get Contents of URL</span>
          </li>
          <li>Paste your personal URL (copy it below)</li>
          <li>
            Tap the little <span className="font-medium">&gt;</span> arrow on the action → Method:{" "}
            <span className="font-medium">POST</span> → Request Body:{" "}
            <span className="font-medium">Form</span>
          </li>
          <li>
            Add two form fields:
            <div className="mt-1.5 ml-4 text-xs bg-gray-50 rounded-lg p-2.5 space-y-1 font-mono">
              <div>
                merchant → <span className="text-blue-600">Merchant</span>{" "}
                <span className="text-gray-400 font-sans">(pick the Shortcut variable)</span>
              </div>
              <div>
                amount → <span className="text-blue-600">Amount</span>{" "}
                <span className="text-gray-400 font-sans">(pick the Shortcut variable)</span>
              </div>
            </div>
          </li>
          <li>Done. Buy something with Apple Pay to test it 🎉</li>
        </ol>

        <div className="pt-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Your personal URL</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shortcutUrl}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <button
              onClick={copy}
              className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 shrink-0"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            This URL is yours — it tags purchases to your name. Don&apos;t share it.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-sm text-blue-800">
        Anything Apple Pay logs automatically still shows up on your page, so you can fix the
        category if the auto-guess gets it wrong.
      </div>
    </div>
  );
}
