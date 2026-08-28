'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { useCurrency } from '@/components/currency-provider';
import { formatUSD } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface PriceStepperProps {
  amountPaise: number;
  onAmountChange: (amountPaise: number) => void;
  className?: string;
  valueClassName?: string;
}

// The +/- buttons move in whole BASE_PRICE_PAISE steps, but the amount is
// also just a plain rupee number you can type into directly. Typing is
// kept in local, unclamped draft state so mid-keystroke values (like "2"
// on the way to "200") aren't yanked back to the minimum — clamping and
// rounding to a whole multiple of the base price only happens on blur.
export function PriceStepper({ amountPaise, onAmountChange, className, valueClassName }: PriceStepperProps) {
  const currency = useCurrency();
  const [draft, setDraft] = useState(String(amountPaise / 100));
  // Re-sync the draft when `amountPaise` changes from outside (the +/-
  // buttons, or a reset when the modal reopens) — adjusted during render
  // rather than in an effect, so it happens in the same commit instead of
  // an extra one. Typing itself never changes `amountPaise` until blur, so
  // this can't clobber a keystroke in progress.
  const [prevAmountPaise, setPrevAmountPaise] = useState(amountPaise);
  if (amountPaise !== prevAmountPaise) {
    setPrevAmountPaise(amountPaise);
    setDraft(String(amountPaise / 100));
  }
  const canDecrease = amountPaise > BASE_PRICE_PAISE;

  const commit = () => {
    const rupees = draft === '' ? 0 : parseInt(draft, 10);
    const clamped = Math.max(
      BASE_PRICE_PAISE,
      Math.round((rupees * 100) / BASE_PRICE_PAISE) * BASE_PRICE_PAISE
    );
    onAmountChange(clamped);
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => canDecrease && onAmountChange(amountPaise - BASE_PRICE_PAISE)}
        disabled={!canDecrease}
        className="inline-flex shrink-0 items-center justify-center size-6 rounded-full bg-background hover:bg-border transition-colors disabled:opacity-40"
      >
        <Minus className="size-3" />
      </button>
      {currency === 'USD' ? (
        // The +/- buttons still move in whole BASE_PRICE_PAISE steps
        // (that's the value that actually ranks the comment) — typing an
        // exact dollar-and-cents amount is more precision than a fixed
        // conversion rate can meaningfully support, so this is read-only.
        <span className={cn('inline-flex items-baseline font-bold tabular-nums', valueClassName)}>
          {formatUSD(amountPaise)}
        </span>
      ) : (
        <span className={cn('inline-flex items-baseline font-bold tabular-nums', valueClassName)}>
          ₹
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label="Amount in rupees"
            className="w-14 bg-transparent text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </span>
      )}
      <button
        type="button"
        onClick={() => onAmountChange(amountPaise + BASE_PRICE_PAISE)}
        className="inline-flex shrink-0 items-center justify-center size-6 rounded-full bg-background hover:bg-border transition-colors"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}
