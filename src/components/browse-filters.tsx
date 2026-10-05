'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { US_STATES } from '@/lib/us-states';

export type UrgencyFilter = 'all' | 'urgent' | 'available';

interface BrowseFiltersProps {
  tab: string;
  currentState: string;
  currentUrgency: UrgencyFilter;
  currentQuery: string;
}

const URGENCY_CHIPS: { key: UrgencyFilter; label: string }[] = [
  { key: 'all', label: 'All dogs' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'available', label: 'Available' },
];

function updateParams(searchParams: URLSearchParams, updates: Record<string, string | null>) {
  const params = new URLSearchParams(searchParams.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === '' || v === 'all') params.delete(k);
    else params.set(k, v);
  }
  params.delete('page');
  return params.toString();
}

export default function BrowseFilters({ tab, currentState, currentUrgency, currentQuery }: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(updates: Record<string, string | null>) {
    router.push(`/dogs?${updateParams(searchParams, updates)}`, { scroll: false });
  }

  return (
    <div className="mb-10 space-y-5">
      {/* Prominent search bar */}
      <form
        action="/dogs"
        method="get"
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          // keep client-side nav smooth
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const q = String(data.get('q') || '').trim();
          go({ q: q || null, tab });
        }}
      >
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <span aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-[#f4b942]">
            ⌕
          </span>
          <input
            type="search"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search by name or breed…"
            className="w-full border-2 border-white/15 bg-[#122016] py-4 pl-14 pr-5 text-lg font-semibold text-[#f8f1e8] placeholder:text-[#f8f1e8]/30 focus:border-[#f4b942] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-[#f4b942] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#ffd86a]"
        >
          Search
        </button>
      </form>

      {/* Urgency chips (dogs tab only) */}
      {tab === 'dogs' && (
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {URGENCY_CHIPS.map((chip) => {
          const active = currentUrgency === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => go({ urgency: chip.key })}
              className={`flex shrink-0 items-center gap-2 border-2 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition ${
                active
                  ? chip.key === 'urgent'
                    ? 'border-[#e04a3a] bg-[#e04a3a] text-white'
                    : 'border-[#f4b942] bg-[#f4b942] text-[#140a08]'
                  : 'border-white/15 text-[#f8f1e8]/60 hover:border-[#f4b942]/60 hover:text-[#f8f1e8]'
              }`}
            >
              {chip.key === 'urgent' && <span className="animate-pulse-dot h-2 w-2 rounded-full bg-current" />}
              {chip.label}
            </button>
          );
        })}
      </div>
      )}

      {/* State chips: horizontal scroll */}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#f8f1e8]/40">Filter by state</p>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => go({ state: null })}
            className={`shrink-0 border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
              currentState === ''
                ? 'border-[#f4b942] bg-[#f4b942] text-[#140a08]'
                : 'border-white/15 text-[#f8f1e8]/60 hover:border-[#f4b942]/60 hover:text-[#f8f1e8]'
            }`}
          >
            All states
          </button>
          {US_STATES.map((s) => (
            <button
              key={s}
              onClick={() => go({ state: s })}
              className={`shrink-0 border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                currentState === s
                  ? 'border-[#f4b942] bg-[#f4b942] text-[#140a08]'
                  : 'border-white/15 text-[#f8f1e8]/60 hover:border-[#f4b942]/60 hover:text-[#f8f1e8]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
