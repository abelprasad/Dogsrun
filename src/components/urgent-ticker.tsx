'use client';

import Link from 'next/link';

export interface TickerDog {
  id: string;
  name: string | null;
  daysLeft: string | null;
}

/**
 * Live "on the clock" marquee strip. Content is duplicated so the CSS
 * translateX(-50%) loop is seamless. Pure CSS animation, no JS timers.
 */
export default function UrgentTicker({ dogs }: { dogs: TickerDog[] }) {
  if (dogs.length === 0) return null;

  const items = [...dogs, ...dogs, ...dogs, ...dogs];

  return (
    <div className="relative overflow-hidden border-y border-[#a8583f]/40 bg-[#0b140e] py-3" aria-label="Dogs running out of time">
      <div className="animate-marquee flex w-max items-center gap-10 pr-10">
        {items.map((dog, i) => (
          <Link
            key={`${dog.id}-${i}`}
            href={`/dogs/${dog.id}`}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-[#c98a7a] transition hover:text-[#f8f1e8]"
            aria-hidden={i >= dogs.length}
            tabIndex={i >= dogs.length ? -1 : undefined}
          >
            <span className="animate-pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            <span>{dog.name || 'Unnamed dog'}</span>
            {dog.daysLeft && <span className="text-[#f8f1e8]/70">— {dog.daysLeft}</span>}
            <span className="ml-6 text-[#a8583f]/50">///</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
