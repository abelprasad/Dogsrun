'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      const { data: { user: signedInUser } } = await supabase.auth.getUser()
      const { data: org } = await supabase
        .from('organizations')
        .select('type')
        .eq('id', signedInUser?.id)
        .maybeSingle()
      router.push(org?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#f4b942] focus:ring-1 focus:ring-[#f4b942] outline-none transition-all text-[#13241d] placeholder-[#9ca3af] text-sm"

  if (sent) {
    return (
      <div className="bg-[#f5f0e8] text-[#13241d]">
        <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942]">Check your email</h1>
          </div>
        </header>
        <main className="flex items-center justify-center px-5 py-16 sm:px-8">
          <div className="max-w-md w-full border border-[#13241d]/10 bg-[#fff9ef] p-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4b942] text-[#13241d]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#5d6a64] mb-2">We sent a magic link to <strong className="text-[#13241d]">{email}</strong></p>
            <p className="text-sm text-[#9ca3af]">Click the link to sign in.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Member access
          </div>
          <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl">
            Welcome back
          </h1>
          <p className="mt-4 text-lg text-[#c8d3ce]">Sign in to your shelter or rescue account</p>
        </div>
      </header>

      <main className="flex items-start justify-center px-5 py-12 sm:px-8">
        <div className="max-w-md w-full">
          <div className="border border-[#13241d]/10 bg-[#fff9ef] p-8">
            {error && (
              <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@shelter.org"
                  required
                  className={inputClass}
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f4b942] py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </button>
            </form>

            {mode === 'password' && (
              <div className="mt-4 text-center">
                <Link href="/auth/reset-password" className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] transition hover:text-[#d95f4b]">
                  Forgot password?
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
                className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] transition hover:text-[#13241d]"
              >
                {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[#5d6a64]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-black text-[#d95f4b] hover:underline">Register</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
