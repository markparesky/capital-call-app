// Currency support: amounts are always STORED in USD so totals and the CSV
// stay consistent; foreign purchases keep their original amount + currency
// alongside. Live rates come from the free frankfurter.app API (ECB data),
// cached in-process for 12 hours, with static approximate rates as a fallback
// so logging never breaks if the rate service is down.

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "$ USD" },
  { code: "AUD", symbol: "A$", label: "A$ AUD" },
  { code: "EUR", symbol: "€", label: "€ EUR" },
  { code: "GBP", symbol: "£", label: "£ GBP" },
  { code: "CAD", symbol: "C$", label: "C$ CAD" },
  { code: "NZD", symbol: "NZ$", label: "NZ$ NZD" },
  { code: "JPY", symbol: "¥", label: "¥ JPY" },
  { code: "MXN", symbol: "MX$", label: "MX$ MXN" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCIES.some((c) => c.code === value);
}

// Approximate rates to USD, used only if the live lookup fails.
const FALLBACK_TO_USD: Record<string, number> = {
  AUD: 0.65,
  EUR: 1.15,
  GBP: 1.33,
  CAD: 0.72,
  NZD: 0.6,
  JPY: 0.0068,
  MXN: 0.054,
};

let rateCache: { toUSD: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

async function ratesToUSD(): Promise<Record<string, number>> {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.toUSD;
  }
  try {
    const codes = CURRENCIES.filter((c) => c.code !== "USD").map((c) => c.code);
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${codes.join(",")}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`rate fetch ${res.status}`);
    const data = await res.json();
    // frankfurter returns units-per-USD; invert to get USD-per-unit.
    const toUSD: Record<string, number> = {};
    for (const code of codes) {
      if (data.rates?.[code]) toUSD[code] = 1 / data.rates[code];
    }
    if (Object.keys(toUSD).length > 0) {
      rateCache = { toUSD: { ...FALLBACK_TO_USD, ...toUSD }, fetchedAt: Date.now() };
      return rateCache.toUSD;
    }
  } catch {
    // fall through to static rates
  }
  return FALLBACK_TO_USD;
}

export async function convertToUSD(amount: number, currency: CurrencyCode): Promise<number> {
  if (currency === "USD") return amount;
  const rates = await ratesToUSD();
  const rate = rates[currency] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

// Detect a currency from the formatting of an amount string like "A$12.34",
// "12,34 €", or "1200 JPY" — used by the Apple Pay shortcut endpoint, where
// foreign taps report the local-currency amount.
export function detectCurrency(raw: string): CurrencyCode | null {
  const t = raw.toUpperCase();
  if (t.includes("A$") || t.includes("AU$") || t.includes("AUD")) return "AUD";
  if (t.includes("NZ$") || t.includes("NZD")) return "NZD";
  if (t.includes("C$") || t.includes("CA$") || t.includes("CAD")) return "CAD";
  if (t.includes("MX$") || t.includes("MXN")) return "MXN";
  if (t.includes("€") || t.includes("EUR")) return "EUR";
  if (t.includes("£") || t.includes("GBP")) return "GBP";
  if (t.includes("¥") || t.includes("JPY") || t.includes("YEN")) return "JPY";
  if (t.includes("USD")) return "USD";
  return null;
}

export function formatOriginal(amount: number, currency: string): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || `${currency} `;
  const digits = currency === "JPY" ? 0 : 2;
  return `${symbol}${amount.toFixed(digits)}`;
}
