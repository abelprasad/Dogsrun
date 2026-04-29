'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) { setError(error.message) } else { setSent(true) }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Check your email</h1>
          </div>
        </header>
        <main className="py-8 px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#6b7280] mb-2">We sent a reset link to <strong>{email}</strong></p>
            <p className="text-sm text-[#9ca3af] mb-6">Click the link to set a new password.</p>
            <Link href="/auth/login" className="text-[#f59e0b] font-bold hover:underline text-sm">Back to login</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Reset password</h1>
          <p className="text-[#6b7280]">We&apos;ll send a reset link to your email</p>
        </div>
      </header>
      <main className="py-8 px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@shelter.org" required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#111] text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </div>
          <p className="text-center mt-6 text-sm text-[#6b7280]">
            <Link href="/auth/login" className="text-[#f59e0b] font-bold hover:underline">Back to login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
