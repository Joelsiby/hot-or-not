'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface VoteMeterProps {
  hotPaise: number;
  notPaise: number;
  topAuthorName?: string;
}

const ROTATE_MS = 5000;

// 20 lines, cycling every 5s — every 5th (indexes 4, 9, 14, 19) is the
// plain factual status; the rest are mockery/hype filler, some of which
// roast whichever side is losing and some of which call out the top
// commentator by name.
function buildLines(winner: 'Hot' | 'Not' | null, loser: 'Hot' | 'Not' | null, topAuthorName?: string) {
  const l = loser ?? 'Not';
  const status = winner ? `${winner} is winning` : "It's tied";
  const author = topAuthorName?.trim() || 'somebody';

  return [
    `Somebody's ego is about to get destroyed 💀`,
    `The ${l} fans are typing furiously right now`,
    `This isn't a democracy, it's a wallet contest`,
    `Imagine losing an argument to people with more disposable income`,
    status,
    `Bro really paid real money to defend a movie opinion 😭`,
    `${author} is out here carrying this entire leaderboard`,
    `The ${l} side needs an intervention, not another upvote`,
    `Someone's UPI app is crying right now`,
    status,
    `This comment section has more drama than the movie itself`,
    `Massive respect to ${author} for putting actual money where their mouth is`,
    `${l} fans in absolute shambles rn`,
    `Cope harder, ${l} squad`,
    status,
    `₹20 well spent on absolutely nothing productive`,
    `${author} really said "watch me flex" and meant it`,
    `The audacity of the ${l} side to still be showing up`,
    `Someone go tell ${l} fans the ranking isn't changing tonight`,
    status,
  ];
}

export function VoteMeter({ hotPaise, notPaise, topAuthorName }: VoteMeterProps) {
  const total = hotPaise + notPaise;
  const hotPct = total === 0 ? 50 : Math.round((hotPaise / total) * 100);
  const isTied = hotPaise === notPaise;
  const winner = isTied ? null : hotPaise > notPaise ? 'Hot' : 'Not';
  const loser = isTied ? null : winner === 'Hot' ? 'Not' : 'Hot';

  const lines = buildLines(winner, loser, topAuthorName);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [lines.length]);

  const currentLine = lines[lineIndex % lines.length];
  const isStatusLine = lineIndex % 5 === 4;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span className="text-orange-600 shrink-0">🔥 {formatINR(hotPaise)}</span>
        <span
          key={lineIndex}
          className={cn(
            'animate-in fade-in duration-300 text-center text-xs font-bold uppercase tracking-wide',
            isStatusLine
              ? isTied
                ? 'text-muted-foreground'
                : winner === 'Hot'
                  ? 'text-orange-600'
                  : 'text-sky-600'
              : 'text-muted-foreground normal-case tracking-normal'
          )}
        >
          {currentLine}
        </span>
        <span className="text-sky-600 shrink-0">❄️ {formatINR(notPaise)}</span>
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
