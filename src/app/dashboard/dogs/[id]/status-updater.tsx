'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface StatusUpdaterProps {
  dogId: string;
  currentStatus: string;
}

const statuses = [
  { value: 'available', label: 'Available' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'pending', label: 'Pending' },
  { value: 'rescue_requested', label: 'Rescue Requested' },
  { value: 'placed', label: 'Placed' },
  { value: 'adopted', label: 'Adopted' },
];

export default function StatusUpdater({ dogId, currentStatus }: StatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('dogs')
      .update({ status: newStatus })
      .eq('id', dogId);

    if (error) {
      alert('Failed to update status: ' + error.message);
      setStatus(currentStatus);
    } else {
      setStatus(newStatus);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Update Status</label>
      <select
        value={status}
        disabled={loading}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all bg-white font-semibold text-[#111] text-sm"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {loading && <p className="text-[10px] text-[#f59e0b] animate-pulse uppercase font-bold tracking-widest">Updating...</p>}
    </div>
  );
}
