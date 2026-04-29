'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AlertActions({ alertId, currentStatus }: { alertId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    setLoading(true)
    const res = await fetch('/api/alerts/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId, status: newStatus }),
    })
    if (res.ok) {
      setStatus(newStatus)
      router.refresh()
    } else {
      alert('Failed to update. Please try again.')
    }
    setLoading(false)
  }

  if (status === 'responded') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[#166534] font-bold text-sm bg-[#dcfce7] px-4 py-2 rounded-lg border border-[#166534]/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Interested ✓
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[#6b7280] font-medium text-sm bg-[#f3f4f6] px-4 py-2 rounded-lg border border-gray-200">
          Passed
        </span>
        <button
          onClick={() => updateStatus('sent')}
          disabled={loading}
          className="text-xs font-semibold text-[#9ca3af] hover:text-[#f59e0b] transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Undo'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => updateStatus('declined')}
        disabled={loading}
        className="px-5 py-2.5 border border-gray-300 text-[#374151] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? '...' : 'Pass'}
      </button>
      <button
        onClick={() => updateStatus('responded')}
        disabled={loading}
        className="px-5 py-2.5 bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'Updating...' : 'Interested'}
      </button>
    </div>
  )
}
