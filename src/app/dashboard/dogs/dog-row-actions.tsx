'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOG_STATUSES, DOG_STATUS_LABELS } from '@/lib/dog-status';
import Button from '@/components/ui/button';
import { useToast } from '@/components/toaster';

// REVIEW: pending status + Apply button; save on change like the admin dogs-table.
export default function DogRowActions({ dogId, currentStatus }: { dogId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState(currentStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

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
      toast.error('Failed to update status. Please try again.');
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
          isDirty ? 'border-[#c08a3e] ring-1 ring-[#c08a3e]' : 'border-[#13241d]/20'
        }`}
      >
        {DOG_STATUSES.map((value) => (
          <option key={value} value={value}>{DOG_STATUS_LABELS[value]}</option>
        ))}
      </select>

      {/* Apply — only shows when changed */}
      {isDirty && (
        <button
          onClick={handleApplyStatus}
          disabled={statusLoading}
          className="text-xs font-bold px-3 py-2 bg-[#13241d] text-[#c08a3e] hover:bg-[#1f332a] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {statusLoading ? 'Saving...' : 'Apply'}
        </button>
      )}

      {/* Edit */}
      <Button
        href={`/dashboard/dogs/${dogId}/edit`}
        size="sm"
        className="whitespace-nowrap"
      >
        Edit
      </Button>
    </div>
  );
}