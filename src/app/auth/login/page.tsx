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
<<<<<<< HEAD
      const { data: { user: signedInUser } } = await supabase.auth.getUser()
      const { data: org } = await supabase
        .from('organizations')
        .select('type')
        .eq('id', signedInUser?.id)
        .maybeSingle()
      router.push(org?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard')
=======
      router.push('/dashboard/welcome')
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
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
<<<<<<< HEAD
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
=======
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
            <p className="text-[#13241d] font-semibold mb-1">Magic link sent to</p>
            <p className="text-[#5d6a64] font-bold mb-2">{email}</p>
            <p className="text-sm text-[#5d6a64]">Click the link in your email to sign in.</p>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
          </div>
        </main>
      </div>
    )
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#13241d] py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">DOGSRUN</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Welcome Back</h1>
          <p className="text-[#f5f0e8]/60 mt-3 text-sm">Sign in to your shelter or rescue account</p>
        </div>
      </header>

      <main className="py-16 px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 mb-6">{error}</div>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
<<<<<<< HEAD
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Email address</label>
=======
                <label className="block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2">Email Address</label>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@shelter.org"
                  required
<<<<<<< HEAD
                  className={inputClass}
=======
                  className="w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#13241d] focus:ring-0 outline-none transition-colors text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
                />
              </div>

              {mode === 'password' && (
                <div>
<<<<<<< HEAD
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Password</label>
=======
                  <label className="block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2">Password</label>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
<<<<<<< HEAD
                    className={inputClass}
=======
                    className="w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#13241d] focus:ring-0 outline-none transition-colors text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
<<<<<<< HEAD
                className="w-full bg-[#f4b942] py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50"
=======
                className="w-full py-3 bg-[#13241d] text-[#f4b942] text-xs uppercase tracking-[0.24em] font-bold hover:bg-[#1a2e1a] transition-colors disabled:opacity-50"
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
              >
                {loading ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </button>
            </form>

            {mode === 'password' && (
              <div className="mt-4 text-center">
<<<<<<< HEAD
                <Link href="/auth/reset-password" className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] transition hover:text-[#d95f4b]">
=======
                <Link href="/auth/reset-password" className="text-xs text-[#5d6a64] hover:text-[#13241d] transition-colors font-semibold">
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
                  Forgot password?
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
<<<<<<< HEAD
                className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] transition hover:text-[#13241d]"
=======
                className="text-xs text-[#5d6a64] hover:text-[#13241d] transition-colors uppercase tracking-wider font-bold"
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
              >
                {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </button>
            </div>
          </div>

<<<<<<< HEAD
          <p className="mt-8 text-center text-sm text-[#5d6a64]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-black text-[#d95f4b] hover:underline">Register</Link>
=======
          <p className="text-center mt-8 text-sm text-[#5d6a64]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] hover:text-[#f4b942] transition-colors">
              Register
            </Link>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
          </p>
        </div>
      </main>
    </div>
  )
}
