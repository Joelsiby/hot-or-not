// Every amount in the app is stored and ranked in INR paise (comments,
// the vote meter, PriceStepper's internal state) — that never changes.
// This module only handles the *display* and *checkout* side: a visitor
// outside India sees prices in USD and is actually charged in USD via
// Razorpay, converted from the same underlying paise value at a fixed
// rate. Ranking/sorting is unaffected either way since it's always
// comparing INR-paise values, never the charged currency.

export type Currency = 'INR' | 'USD';

// Fixed conversion rate, not a live FX lookup — simple and predictable,
// but drifts from the real rate over time. Update this constant
// periodically (or swap in a live FX API later) if it gets stale.
export const USD_PER_INR = 87;

import { formatINR } from '@/lib/constants';

// Vercel populates this header on every request in production (Edge and
// Node runtimes alike) with a two-letter country code from the visitor's
// IP. It's absent in local dev, where we default to India.
export function detectCurrency(countryCode: string | null | undefined): Currency {
  return countryCode && countryCode.toUpperCase() !== 'IN' ? 'USD' : 'INR';
}

// paise -> whole USD cents, floored at 1 cent so a ₹20 base price never
// rounds down to a free order.
export function paiseToUsdCents(paise: number): number {
  return Math.max(1, Math.round(paise / USD_PER_INR));
}

export function formatUSD(paise: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(paiseToUsdCents(paise) / 100);
}

// The one function most components should actually call — formats the
// same underlying paise value in whichever currency the visitor sees.
export function formatMoney(paise: number, currency: Currency) {
  return currency === 'USD' ? formatUSD(paise) : formatINR(paise);
}
