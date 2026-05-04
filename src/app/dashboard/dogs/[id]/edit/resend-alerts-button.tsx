'use client'

import { useState } from 'react'

export default function ResendAlertsButton({ dogId }: { dogId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleResend() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dog_id: dogId }),
      })
      const data = await res.json()
      setResult(data.message || 'Done')
    } catch {
      setResult('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="px-5 py-4 border-b border-[#13241d]/10 space-y-3">
      <button
        onClick={handleResend}
        disabled={loading}
        className="w-full bg-[#13241d] text-[#f4b942] text-xs font-black uppercase tracking-[0.18em] py-2.5 hover:bg-[#1a2e1a] transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Resend Alerts'}
      </button>
      {result && (
        <p className="text-[11px] text-center text-[#5d6a64] leading-5">{result}</p>
      )}
    </div>
  )
}
