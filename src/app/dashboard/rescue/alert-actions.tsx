'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toaster'

interface AlertActionsProps {
  alertId: string
  currentStatus: string
  large?: boolean
}

export default function AlertActions({ alertId, currentStatus, large = false }: AlertActionsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const btnSize = large ? 'px-10 py-4 text-base' : 'px-7 py-3 text-sm'

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
      toast.error('Failed to update. Please try again.')
    }
    setLoading(false)
  }

  if (status === 'responded') {
    return (
      <div className={`flex items-center gap-2 border border-[#7ddba3]/50 bg-[#7ddba3]/10 ${btnSize} text-sm font-black uppercase tracking-[0.16em] text-[#7ddba3]`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Interested
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-black uppercase tracking-[0.16em] text-[#f8f1e8]/40">Passed</span>
        <button
          onClick={() => updateStatus('sent')}
          disabled={loading}
          className="border border-white/25 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f8f1e8]/70 transition hover:border-[#f4b942] hover:text-[#f4b942] disabled:opacity-50"
        >
          {loading ? '...' : 'Undo'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => updateStatus('responded')}
      disabled={loading}
      className={`bg-[#f4b942] font-black uppercase tracking-[0.16em] text-[#140a08] transition hover:bg-[#ffd86a] disabled:opacity-50 ${btnSize}`}
    >
      {loading ? '...' : "I'm interested"}
    </button>
  )
}
