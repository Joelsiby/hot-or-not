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

const ROTATE_MS = 15000;

function pick(pool: string[], seed: number, fallback: string) {
  const name = pool[seed % Math.max(pool.length, 1)]?.trim();
  return name || fallback;
}

// 70 lines, cycling every ROTATE_MS — every 5th index is the plain
// factual status; the rest are mockery/hype filler pulling real names
// from the top 10 commenters on each side (winnerNames/loserNames),
// roasting whoever's behind and hyping up whoever's ahead. The back half
// leans on Indian movie-Twitter/review-culture slang (FDFS, mass entry,
// box office, review bombing, pan-India, housefull, hit-ya-flop, etc.).
function buildLines(
  winner: 'Hype' | 'Hate' | null,
  loser: 'Hype' | 'Hate' | null,
  winnerNames: string[],
  loserNames: string[]
) {
  const l = loser ?? 'Hate';
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
    `${loserName(10)} ka review section mein sannata hai`,
    `FDFS mein hi pata chal gaya tha, ${loserName(11)}`,
    `Public verdict: ${loserName(12)} ka paisa dooba`,
    `${winnerName(4)} ne toh box office hi tod diya`,
    status,
    `Twitter pe #${l}IsOut trending kar raha hai`,
    `${loserName(13)}, interval tak hi tha dum`,
    `Critics vs ${loserName(14)} — dono match nahi kar rahe`,
    `${winnerName(5)} ka mass entry dekh ke goosebumps aa gaye`,
    status,
    `Housefull board utar gaya ${loserName(15)} ke liye`,
    `${loserName(16)} review bomb ho gaya, RIP`,
    `Day 1 collection dekh ke ${loserName(17)} chup baith gaya`,
    `${winnerName(6)} pura pan-India domination kar raha hai`,
    status,
    `${loserName(18)} ka cinema hall mein sirf popcorn wala bacha`,
    `Hit ya flop? ${loserName(19)} ke liye answer pata hai sabko`,
    `Post-credit scene se zyada excitement ${loserName(0)} mein nahi hai`,
    `${winnerName(7)} ne single-handedly leaderboard bacha liya`,
    status,
    `${loserName(1)} ka trailer hype se zyada flop bada nikla`,
    `One man army ${winnerName(8)}, baaki sab extras`,
    `${loserName(2)} ki performance dekh ke public silent ho gayi`,
    `Mass mass mass — sirf ${winnerName(9)} ke naam ka hai yeh`,
    status,
    `${loserName(3)}, bhai theatre chhod ke Netflix pe chala ja`,
    `Review section mein sirf ${loserName(4)} ke against comments hain`,
    `${winnerName(0)} ka goosebumps moment sabko yaad rahega`,
    `Paisa vasool nahi hua ${loserName(5)} ke liye, confirm`,
    status,
    `${loserName(6)} ka fanbase bhi ab silent mode mein hai`,
    `Trending on Twitter: #${loserName(7)}Flopped`,
    `${winnerName(1)} ne toh interval mein hi jeet li thi`,
    `Critics rating aur ${loserName(8)} ki izzat dono neeche gaye`,
    status,
    `${loserName(9)} ke liye "paisa vasool" ek myth reh gaya`,
    `${winnerName(2)} ka mass appeal dekh ke sab silent`,
    `Box office se ${loserName(10)} ka naam hi mit gaya`,
    `Public review: "${loserName(11)}, kabhi mat aana wapas"`,
    status,
    `${winnerName(3)} deserve karta hai ek national award, seriously`,
    `${loserName(12)} ka scene khatam, credits roll ho gaye`,
    `FDFS crowd ne bhi ${loserName(13)} ko reject kar diya`,
    `${winnerName(4)} ka craze dekh ke fans line mein khade hain`,
    status,
    `${loserName(14)} flop show confirm ho gaya bhai`,
    `Review bombing ka record ${loserName(15)} ke naam ho gaya`,
    `${winnerName(5)} sabse zyada trending kar raha hai abhi`,
    `Housefull sirf ${winnerName(6)} ke naam pe ho raha hai`,
    status,
  ];
}

export function VoteMeter({ hotPaise, notPaise, hotTopNames = [], notTopNames = [] }: VoteMeterProps) {
  const total = hotPaise + notPaise;
  const hotPct = total === 0 ? 50 : Math.round((hotPaise / total) * 100);
  const isTied = hotPaise === notPaise;
  const winner = isTied ? null : hotPaise > notPaise ? 'Hype' : 'Hate';
  const loser = isTied ? null : winner === 'Hype' ? 'Hate' : 'Hype';
  const winnerNames = winner === 'Hate' ? notTopNames : hotTopNames;
  const loserNames = winner === 'Hate' ? hotTopNames : notTopNames;

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
        <span className="text-red-600 shrink-0">🔥 {formatINR(notPaise)}</span>
        <span
          key={lineIndex}
          className={cn(
            'animate-in fade-in duration-300 text-center text-xs font-bold uppercase tracking-wide',
            isStatusLine
              ? isTied
                ? 'text-muted-foreground'
                : winner === 'Hype'
                  ? 'text-sky-600'
                  : 'text-red-600'
              : 'text-muted-foreground normal-case tracking-normal'
          )}
        >
          {currentLine}
        </span>
        <span className="text-sky-600 shrink-0">⚡ {formatINR(hotPaise)}</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sky-500/20">
        <div
          className="h-full rounded-full bg-red-500 transition-all duration-500"
          style={{ width: `${100 - hotPct}%` }}
        />
      </div>
    </div>
  );
}
