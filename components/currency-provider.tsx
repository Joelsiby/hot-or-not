'use client';

import { createContext, useContext } from 'react';
import type { Currency } from '@/lib/currency';

const CurrencyContext = createContext<Currency>('INR');

// The actual detection happens once, server-side, in app/layout.tsx (a
// Server Component reading the request's geo header) — this just carries
// that single value down to every client component via context, so nothing
// re-detects or flashes between currencies on the client.
export function CurrencyProvider({ currency, children }: { currency: Currency; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
