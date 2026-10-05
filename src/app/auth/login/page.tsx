'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui'
import AuthShell, {
  authInputClass,
  authLabelClass,
  authErrorClass,
} from '@/components/auth-shell'

const LOGIN_IMAGE =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1600&q=85'

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
      const [{ data: admin }, { data: org }] = await Promise.all([
        supabase
          .from('admins')
          .select('id')
          .eq('email', signedInUser?.email)
          .maybeSingle(),
        supabase
          .from('organizations')
          .select('type')
          .eq('id', signedInUser?.id)
          .maybeSingle(),
      ])

      router.push(admin && !org ? '/admin' : org ? '/dashboard/welcome' : '/dashboard')
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

  if (sent) {
    return (
      <AuthShell
        image={LOGIN_IMAGE}
        imageAlt="Rescue dog looking up"
        eyebrow="Magic link sent"
        headline={
          <>
            <span className="block text-[#f8f1e8]">Check your</span>
            <span className="block text-[#c08a3e]">inbox.</span>
          </>
        }
        copy="One click and you are back in the fight. The link expires soon, so don't let it sit."
        urgentNote="Links expire — move fast"
      >
        <div className="border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center bg-[#c08a3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#140a08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-[#f8f1e8]">Magic link sent to</p>
          <p className="mb-3 mt-1 font-bold text-[#c08a3e] break-all">{email}</p>
          <p className="text-sm text-[#f8f1e8]/60">Click the link in your email to sign in.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      image={LOGIN_IMAGE}
      imageAlt="Rescue dog looking up"
      eyebrow="Live shelter-to-rescue matching"
      headline={
        <>
          <span className="block text-[#f8f1e8]">Back to</span>
          <span className="block text-[#c08a3e]">the rescue.</span>
          <span className="text-outline block">No time to waste.</span>
        </>
      }
      copy="Sign in to keep matching urgent dogs with the rescues that can save them. While you're away, the clock keeps ticking."
    >
      <h2 className="text-3xl font-black uppercase tracking-tight text-[#f8f1e8] sm:text-4xl">
        Welcome back
      </h2>
      <p className="mt-2 text-sm text-[#f8f1e8]/60">
        Sign in to your shelter or rescue account.
      </p>

      {error && <div className={`${authErrorClass} mt-6`}>{error}</div>}

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <div>
          <label className={authLabelClass}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shelter.org"
            required
            className={authInputClass}
          />
        </div>

        {mode === 'password' && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className={authLabelClass}>Password</label>
              <Button
                href="/auth/reset-password"
                variant="ghost"
                className="mb-2 text-xs font-bold uppercase tracking-wider"
              >
                Forgot?
              </Button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={authInputClass}
            />
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8f1e8]/50 transition hover:text-[#c08a3e]"
        >
          {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
        </button>
      </div>

      <p className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-[#f8f1e8]/50">
        New to DOGSRUN?{' '}
        <Link
          href="/register"
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#c08a3e] transition hover:text-[#d4a050]"
        >
          Join the mission
        </Link>
      </p>
    </AuthShell>
  )
}
