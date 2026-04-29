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

  async function handleShare() {
    const url = `${window.location.origin}/dogs/${dogId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Copied!');
      setTimeout(() => setShareLabel('Share'), 2000);
    } catch {
      setShareLabel('Share');
    }
  }

  const isDirty = pendingStatus !== status;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Status dropdown */}
      <select
        value={pendingStatus}
        disabled={statusLoading}
        onChange={(e) => setPendingStatus(e.target.value)}
        className={`text-xs font-semibold border rounded-lg px-3 py-2 bg-white text-[#111] outline-none transition-all disabled:opacity-50 cursor-pointer ${
          isDirty ? 'border-[#f59e0b] ring-1 ring-[#f59e0b]' : 'border-gray-200'
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
          className="text-xs font-bold px-3 py-2 rounded-lg bg-[#111] text-white hover:bg-black transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {statusLoading ? 'Saving...' : 'Apply'}
        </button>
      )}

      {/* Edit */}
      <Link
        href={`/dashboard/dogs/${dogId}/edit`}
        className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#f59e0b] text-[#451a03] hover:bg-[#d97706] transition-colors whitespace-nowrap"
      >
        Edit
      </Link>
    </div>
  );
}
