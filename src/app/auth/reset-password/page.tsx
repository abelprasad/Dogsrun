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
      <div className="min-h-screen bg-[#f5f0e8]">
        <header className="bg-[#13241d] py-12 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">DOGSRUN</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Check Your Email</h1>
          </div>
        </header>
        <main className="py-16 px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-10 text-center">
            <div className="w-14 h-14 bg-[#13241d] flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#f4b942]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#13241d] font-semibold mb-1">Reset link sent to</p>
            <p className="text-[#5d6a64] mb-2 font-bold">{email}</p>
            <p className="text-sm text-[#5d6a64] mb-8">Click the link in your email to set a new password.</p>
            <Link href="/auth/login" className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] hover:text-[#f4b942] transition-colors">
              ← Back to Login
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#13241d] py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">DOGSRUN</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Reset Password</h1>
          <p className="text-[#f5f0e8]/60 mt-3 text-sm">We&apos;ll send a reset link to your email</p>
        </div>
      </header>
      <main className="py-16 px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 mb-6">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@shelter.org"
                  required
                  className="w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#13241d] focus:ring-0 outline-none transition-colors text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#13241d] text-[#f4b942] text-xs uppercase tracking-[0.24em] font-bold hover:bg-[#1a2e1a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
          <p className="text-center mt-8">
            <Link href="/auth/login" className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] hover:text-[#f4b942] transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
