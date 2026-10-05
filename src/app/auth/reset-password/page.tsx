'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui'
import AuthShell, {
  authInputClass,
  authLabelClass,
  authErrorClass,
} from '@/components/auth-shell'

const RESET_IMAGE =
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=1600&q=85'

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
      <AuthShell
        image={RESET_IMAGE}
        imageAlt="Shelter dog resting"
        eyebrow="Reset link sent"
        headline={
          <>
            <span className="block text-[#f8f1e8]">Check your</span>
            <span className="block text-[#c08a3e]">inbox.</span>
          </>
        }
        copy="Your reset link is on its way. Grab it, set a new password, and get back in the fight."
        urgentNote="Reset links expire — move fast"
      >
        <div className="border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center bg-[#c08a3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#140a08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-[#f8f1e8]">Reset link sent to</p>
          <p className="mb-3 mt-1 font-bold text-[#c08a3e] break-all">{email}</p>
          <p className="mb-8 text-sm text-[#f8f1e8]/60">
            Click the link in your email to set a new password.
          </p>
          <Button href="/auth/login" variant="ghost" className="text-xs font-bold uppercase tracking-[0.2em]">
            Back to Login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      image={RESET_IMAGE}
      imageAlt="Shelter dog resting"
      eyebrow="Account recovery"
      headline={
        <>
          <span className="block text-[#f8f1e8]">Locked out?</span>
          <span className="block text-[#c08a3e]">Don't wait.</span>
          <span className="text-outline block">Get back in.</span>
        </>
      }
      copy="Losing access shouldn't cost a dog its window. Send a reset link and be back matching in minutes."
    >
      <h2 className="text-3xl font-black uppercase tracking-tight text-[#f8f1e8] sm:text-4xl">
        Reset password
      </h2>
      <p className="mt-2 text-sm text-[#f8f1e8]/60">
        We&apos;ll send a secure reset link to your email.
      </p>

      {error && <div className={`${authErrorClass} mt-6`}>{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className={authLabelClass}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@shelter.org"
            required
            className={authInputClass}
          />
        </div>
        <Button type="submit" disabled={loading || !email} className="w-full">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-10 border-t border-white/10 pt-6 text-center">
        <Link
          href="/auth/login"
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8f1e8]/50 transition hover:text-[#c08a3e]"
        >
          Back to Login
        </Link>
      </p>
    </AuthShell>
  )
}
