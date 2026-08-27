'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface VoteMeterProps {
  hotPaise: number;
  notPaise: number;
  hotTopNames?: string[];
  notTopNames?: string[];
}

const ROTATE_MS = 5000;

function pick(pool: string[], seed: number, fallback: string) {
  const name = pool[seed % Math.max(pool.length, 1)]?.trim();
  return name || fallback;
}

// 20 lines, cycling every 5s — every 5th (indexes 4, 9, 14, 19) is the
// plain factual status; the rest are mockery/hype filler pulling real
// names from the top 10 commenters on each side (winnerNames/loserNames),
// roasting whoever's behind and hyping up whoever's ahead.
function buildLines(
  winner: 'Hot' | 'Not' | null,
  loser: 'Hot' | 'Not' | null,
  winnerNames: string[],
  loserNames: string[]
) {
  const l = loser ?? 'Not';
  const status = winner ? `${winner} is winning` : "It's tied";
  const loserName = (seed: number) => pick(loserNames, seed, `the ${l} crowd`);
  const winnerName = (seed: number) => pick(winnerNames, seed, 'somebody');

  return [
    `${loserName(0)} ka ego ab girne wala hai 💀`,
    `${loserName(1)} really said "let me embarrass myself" and did it`,
    `Yeh democracy nahi hai bhai, wallet ka contest hai`,
    `${loserName(2)}, bas kar de yaar, ho gaya khatam`,
    status,
    `${winnerName(0)} ne "dekh mera jalwa" bola aur dikha bhi diya 😭`,
    `${winnerName(1)} is out here carrying this entire leaderboard`,
    `${loserName(3)} ko upvote nahi, therapy chahiye`,
    `Someone tell ${loserName(4)} unka UPI app ro raha hai`,
    status,
    `This comment section has more drama than the movie itself`,
    `Full respect ${winnerName(2)} ko, asli paisa laga diya`,
    `${loserName(5)} ekdum dhoye gaye hain aaj`,
    `Cope kar le zyada, ${loserName(6)}`,
    status,
    `₹20 ekdum bekaar kharcha, ${loserName(7)}`,
    `${winnerName(3)} really understood the assignment`,
    `${loserName(8)} ki himmat dekho, abhi bhi yahin hai`,
    `Kisi ko jaake bol do ${loserName(9)}, ranking nahi badlegi aaj raat`,
    status,
  ];
}

export function VoteMeter({ hotPaise, notPaise, hotTopNames = [], notTopNames = [] }: VoteMeterProps) {
  const total = hotPaise + notPaise;
  const hotPct = total === 0 ? 50 : Math.round((hotPaise / total) * 100);
  const isTied = hotPaise === notPaise;
  const winner = isTied ? null : hotPaise > notPaise ? 'Hot' : 'Not';
  const loser = isTied ? null : winner === 'Hot' ? 'Not' : 'Hot';
  const winnerNames = winner === 'Not' ? notTopNames : hotTopNames;
  const loserNames = winner === 'Not' ? hotTopNames : notTopNames;

  const lines = buildLines(winner, loser, winnerNames, loserNames);
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
