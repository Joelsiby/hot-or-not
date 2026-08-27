'use client';

import { formatINR } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface VoteMeterProps {
  hotPaise: number;
  notPaise: number;
}

export function VoteMeter({ hotPaise, notPaise }: VoteMeterProps) {
  const total = hotPaise + notPaise;
  const hotPct = total === 0 ? 50 : Math.round((hotPaise / total) * 100);
  const isHotWinning = hotPaise > notPaise;
  const isTied = hotPaise === notPaise;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-orange-600">🔥 {formatINR(hotPaise)}</span>
        <span
          className={cn(
            'text-xs font-bold uppercase tracking-wide',
            isTied ? 'text-muted-foreground' : isHotWinning ? 'text-orange-600' : 'text-sky-600'
          )}
        >
          {isTied ? "It's tied" : isHotWinning ? 'Hot is winning' : 'Not is winning'}
        </span>
        <span className="text-sky-600">❄️ {formatINR(notPaise)}</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sky-500/20">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${hotPct}%` }}
        />
      </div>
    </div>
  );
}
