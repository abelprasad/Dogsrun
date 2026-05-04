'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'pending', label: 'Pending' },
  { value: 'rescue_requested', label: 'Rescue Requested' },
  { value: 'placed', label: 'Placed' },
  { value: 'adopted', label: 'Adopted' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'transferred', label: 'Transferred' },
];

export default function DogRowActions({ dogId, currentStatus }: { dogId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState(currentStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();

  async function handleApplyStatus() {
    if (pendingStatus === status) return;
    setStatusLoading(true);
    const response = await fetch('/api/dogs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dog_id: dogId, status: pendingStatus }),
    });
    if (response.ok) {
      setStatus(pendingStatus);
      router.refresh();
    } else {
      alert('Failed to update status');
      setPendingStatus(status);
    }
    setStatusLoading(false);
  }

  const isDirty = pendingStatus !== status;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Status dropdown */}
      <select
        value={pendingStatus}
        disabled={statusLoading}
        onChange={(e) => setPendingStatus(e.target.value)}
        className={`text-xs font-semibold border px-3 py-2 bg-[#fffaf2] text-[#13241d] outline-none transition-all disabled:opacity-50 cursor-pointer ${
          isDirty ? 'border-[#f4b942] ring-1 ring-[#f4b942]' : 'border-[#13241d]/20'
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Apply — only shows when changed */}
      {isDirty && (
        <button
          onClick={handleApplyStatus}
          disabled={statusLoading}
          className="text-xs font-bold px-3 py-2 bg-[#13241d] text-[#f4b942] hover:bg-[#1f332a] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {statusLoading ? 'Saving...' : 'Apply'}
        </button>
      )}

      {/* Edit */}
      <Link
        href={`/dashboard/dogs/${dogId}/edit`}
        className="text-xs font-semibold px-3 py-2 bg-[#f4b942] text-[#13241d] hover:bg-[#e3a72c] transition-colors whitespace-nowrap"
      >
        Edit
      </Link>
    </div>
  );
}
