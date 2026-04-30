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
      <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-black text-green-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Interested
      </div>
    )
  }

  return (
    <button
      onClick={() => updateStatus('responded')}
      disabled={loading}
      className="bg-[#f4b942] px-6 py-2.5 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50"
    >
      {loading ? '...' : 'Interested?'}
    </button>
  )
}
