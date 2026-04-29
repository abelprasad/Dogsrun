'use client';

import { useEffect, useState } from 'react';

function getCountdown(euthanasiaDate: string) {
  const now = new Date();
  const target = new Date(euthanasiaDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHoursRemainder = Math.floor(diffHours % 24);
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { diffMs, diffHours, diffDays, diffHoursRemainder, diffMins };
}

export function getRiskLevel(euthanasiaDate: string | null | undefined): 'critical' | 'at-risk' | 'safe' {
  if (!euthanasiaDate) return 'safe';
  const { diffMs, diffHours } = getCountdown(euthanasiaDate);
  if (diffMs <= 0) return 'critical';
  if (diffHours <= 24) return 'critical';
  return 'at-risk';
}

export default function EuthanasiaCountdown({ euthanasiaDate }: { euthanasiaDate: string }) {
  const [countdown, setCountdown] = useState(() => getCountdown(euthanasiaDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(euthanasiaDate));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [euthanasiaDate]);

  const { diffMs, diffDays, diffHoursRemainder, diffMins } = countdown;
  const isCritical = diffMs <= 0 || countdown.diffHours <= 24;

  if (diffMs <= 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-600 rounded-lg">
        <span className="text-xs font-black text-white uppercase tracking-widest">⚠ Past Euthanasia Date</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 ${isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isCritical ? 'text-red-500' : 'text-amber-600'}`}>
        {isCritical ? '🔴 Critical — Time Running Out' : '⚠ At Risk — Euthanasia Scheduled'}
      </p>
      <div className="flex items-end gap-3">
        {diffDays > 0 && (
          <div className="text-center">
            <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{diffDays}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-amber-500'}`}>day{diffDays !== 1 ? 's' : ''}</p>
          </div>
        )}
        <div className="text-center">
          <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{diffHoursRemainder}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-amber-500'}`}>hr{diffHoursRemainder !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-[900] leading-none ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{diffMins}</p>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCritical ? 'text-red-400' : 'text-amber-500'}`}>min</p>
        </div>
        <div className="flex-1 text-right">
          <p className={`text-[10px] font-semibold ${isCritical ? 'text-red-400' : 'text-amber-500'}`}>
            {new Date(euthanasiaDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
