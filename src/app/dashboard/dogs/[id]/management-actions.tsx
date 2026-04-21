'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ManagementActionsProps {
  dogId: string;
  currentStatus: string;
}

export default function ManagementActions({ dogId, currentStatus }: ManagementActionsProps) {
  const [shareText, setShareText] = useState('Share Profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleShare = async () => {
    const url = `${window.location.origin}/dogs/${dogId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareText('Copied!');
      setTimeout(() => setShareText('Share Profile'), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleMarkUrgent = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/dogs/set-urgent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog_id: dogId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to update status'));
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#111] p-6 rounded-xl border border-white/5 text-white">
      <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Management</h3>
      <div className="space-y-3">
        <Link 
          href={`/dashboard/dogs/${dogId}/edit`}
          className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center"
        >
          Edit Details
        </Link>
        <button 
          onClick={handleShare}
          className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors"
        >
          {shareText}
        </button>
        {currentStatus !== 'urgent' && (
          <button 
            onClick={handleMarkUrgent}
            disabled={isUpdating}
            className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg text-xs font-semibold transition-colors border border-red-900/20 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Mark as Urgent'}
          </button>
        )}
      </div>
    </div>
  );
}
