'use client';

import { parseLocalDate } from '@/lib/date-utils'
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getRiskLevel } from '@/lib/dog-status';

function getCountdown(euthanasiaDate: string) {
  const now = new Date();
  const target = parseLocalDate(euthanasiaDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHoursRemainder = Math.floor(diffHours % 24);
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { diffMs, diffHours, diffDays, diffHoursRemainder, diffMins };
}

// No-op subscribe: the snapshot never changes on its own; hydration flips it.
const subscribeNoop = () => () => {};

export default function EuthanasiaCountdown({ euthanasiaDate }: { euthanasiaDate: string }) {
  // M-F9: client-only to avoid hydration mismatch. The countdown is computed
  // during render once mounted (no setState in the effect body, which CI's
  // react-hooks/set-state-in-effect rule now rejects); the effect only owns
  // the 60s interval, whose callback bumps a tick to re-render.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [euthanasiaDate]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a2e1a] rounded-lg animate-pulse">
        <span className="text-xs font-black text-[#c08a3e]/60 uppercase tracking-widest">Loading…</span>
      </div>
    );
  }
  const countdown = getCountdown(euthanasiaDate);
  const { diffMs, diffDays, diffHoursRemainder, diffMins } = countdown;
  const risk = getRiskLevel(euthanasiaDate);
  const isCritical = risk === 'past-due' || risk === 'critical';

  if (diffMs <= 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-600 rounded-lg">
        <span className="text-xs font-black text-white uppercase tracking-widest">Past Euthanasia Date</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border px-4 py-3 ${isCritical ? 'bg-red-50 border-red-200' : 'bg-[#13241d] border-[#c08a3e]/30'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isCritical ? 'text-red-500' : 'text-[#c08a3e]'}`}>
        {isCritical ? 'Critical - Time Running Out' : 'At Risk - Euthanasia Scheduled'}
      </p>
      <div className="flex items-end gap-3">
        {diffDays > 0 && (
          <div className="text-center">
            <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-[#f8f1e8]'}`}>{diffDays}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-[#d8cfc2]'}`}>day{diffDays !== 1 ? 's' : ''}</p>
          </div>
        )}
        <div className="text-center">
          <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-[#f8f1e8]'}`}>{diffHoursRemainder}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-[#d8cfc2]'}`}>hr{diffHoursRemainder !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-[#f8f1e8]'}`}>{diffMins}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-[#d8cfc2]'}`}>min</p>
        </div>
        <div className="flex-1 text-right">
          <p className={`text-[10px] font-semibold ${isCritical ? 'text-red-400' : 'text-[#d8cfc2]'}`}>
            {parseLocalDate(euthanasiaDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
