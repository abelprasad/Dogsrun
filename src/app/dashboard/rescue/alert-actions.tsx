'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AlertActionsProps {
  alertId: string;
  currentStatus: string;
}

export default function AlertActions({ alertId, currentStatus }: AlertActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateAlertStatus(newStatus: string) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('alerts')
      .update({ status: newStatus })
      .eq('id', alertId);

    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setStatus(newStatus);
      if (newStatus === 'responded') {
        await fetch('/api/notify-shelter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert_id: alertId }),
        });
      }
      router.refresh();
    }
    setLoading(false);
  }

  if (status === 'responded') {
    return (
      <div className="flex items-center gap-2 text-[#166534] font-bold text-sm bg-[#dcfce7] px-4 py-2 rounded-lg border border-[#166534]/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Interested ✓
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="text-[#6b7280] font-medium text-sm bg-[#f3f4f6] px-4 py-2 rounded-lg border border-gray-200">
        Passed
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => updateAlertStatus('declined')}
        disabled={loading}
        className="px-5 py-2.5 border border-gray-300 text-[#374151] bg-transparent font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? '...' : 'Pass'}
      </button>
      <button
        onClick={() => updateAlertStatus('responded')}
        disabled={loading}
        className="px-5 py-2.5 bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg hover:bg-[#d97706] transition-colors shadow-none disabled:opacity-50 text-sm"
      >
        {loading ? 'Updating...' : 'Interested'}
      </button>
    </div>
  );
}
