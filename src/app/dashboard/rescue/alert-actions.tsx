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
      router.refresh();
    }
    setLoading(false);
  }

  if (status === 'interested') {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl border border-green-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Interest Sent
      </div>
    );
  }

  if (status === 'passed') {
    return (
      <div className="text-gray-400 font-medium text-sm">Passed</div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => updateAlertStatus('passed')}
        disabled={loading}
        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
      >
        Pass
      </button>
      <button
        onClick={() => updateAlertStatus('interested')}
        disabled={loading}
        className="px-6 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm font-bold rounded-xl shadow-md transition-all transform active:scale-95 disabled:opacity-50"
      >
        Interested
      </button>
    </div>
  );
}
