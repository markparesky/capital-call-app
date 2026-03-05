interface RenderInput {
  fundName: string;
  legalName?: string | null;
  investorEntityName?: string | null;
  capitalCallNumber: string;
  amount: number;
  currency: string;
  dueDate: string; // ISO date string
  wire: {
    beneficiaryName: string;
    beneficiaryAddress?: string | null;
    bankName: string;
    bankAddress?: string | null;
    abaRouting?: string | null;
    accountNumber?: string | null;
    swift?: string | null;
    iban?: string | null;
    forFurtherCredit?: string | null;
    referenceInstructions?: string | null;
    remittanceEmail?: string | null;
  };
  memoOverride?: string | null;
  signature?: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function renderSubject(input: RenderInput): string {
  const parts = [
    "Capital Call Payment",
    input.fundName,
    input.investorEntityName || null,
    `Call #${input.capitalCallNumber}`,
  ].filter(Boolean);
  return parts.join(" – ");
}

export function renderPlainText(input: RenderInput): string {
  const memo =
    input.memoOverride || input.wire.referenceInstructions || "";
  const lines: string[] = [];

  lines.push("Dear Fund Administrator,");
  lines.push("");
  lines.push(
    "Please find below the details for the following capital call payment:"
  );
  lines.push("");
  lines.push("--- PAYMENT SUMMARY ---");
  lines.push(`Fund: ${input.fundName}${input.legalName ? ` (${input.legalName})` : ""}`);
  lines.push(`Amount: ${formatCurrency(input.amount, input.currency)}`);
  lines.push(`Due Date: ${formatDate(input.dueDate)}`);
  lines.push(`Capital Call #: ${input.capitalCallNumber}`);
  if (input.investorEntityName) {
    lines.push(`Investor Entity: ${input.investorEntityName}`);
  }
  lines.push("");
  lines.push("--- WIRE INSTRUCTIONS ---");
  lines.push(`Beneficiary: ${input.wire.beneficiaryName}`);
  if (input.wire.beneficiaryAddress) {
    lines.push(`Beneficiary Address: ${input.wire.beneficiaryAddress}`);
  }
  lines.push(`Bank: ${input.wire.bankName}`);
  if (input.wire.bankAddress) {
    lines.push(`Bank Address: ${input.wire.bankAddress}`);
  }
  if (input.wire.abaRouting) {
    lines.push(`ABA/Routing #: ${input.wire.abaRouting}`);
  }
  if (input.wire.swift) {
    lines.push(`SWIFT: ${input.wire.swift}`);
  }
  if (input.wire.iban) {
    lines.push(`IBAN: ${input.wire.iban}`);
  }
  if (input.wire.accountNumber) {
    lines.push(`Account #: ${input.wire.accountNumber}`);
  }
  if (input.wire.forFurtherCredit) {
    lines.push(`For Further Credit: ${input.wire.forFurtherCredit}`);
  }
  if (memo) {
    lines.push(`Reference/Memo: ${memo}`);
  }
  if (input.wire.remittanceEmail) {
    lines.push(
      `Please send remittance advice to: ${input.wire.remittanceEmail}`
    );
  }
  lines.push("");
  lines.push(
    "Please ensure payment is received by the due date indicated above."
  );
  lines.push("");
  lines.push("Best regards,");
  if (input.signature) {
    lines.push(input.signature);
  }

  return lines.join("\n");
}

export function renderHtml(input: RenderInput): string {
  const plain = renderPlainText(input);
  const escaped = plain
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">${escaped}</div>`;
}
