'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui'
import AuthShell, {
  authInputClass,
  authLabelClass,
  authErrorClass,
} from '@/components/auth-shell'

const UPDATE_IMAGE =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1600&q=85'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const isRecoveryRedirect = new URLSearchParams(window.location.search).get('recovery') === '1'
    if (isRecoveryRedirect) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setReady(Boolean(session))
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (!ready) {
    return (
      <AuthShell
        image={UPDATE_IMAGE}
        imageAlt="Rescue dog looking up"
        eyebrow="Verifying reset link"
        headline={
          <>
            <span className="block text-[#f8f1e8]">One</span>
            <span className="text-outline block">moment.</span>
          </>
        }
        copy="Checking your reset link so you can get back to the dogs."
      >
        <div className="border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#c08a3e]" />
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#c08a3e]" style={{ animationDelay: '0.2s' }} />
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#c08a3e]" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-sm font-semibold text-[#f8f1e8]/70">Verifying your reset link...</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      image={UPDATE_IMAGE}
      imageAlt="Rescue dog looking up"
      eyebrow="Account recovery"
      headline={
        <>
          <span className="block text-[#f8f1e8]">New password,</span>
          <span className="block text-[#c08a3e]">same mission.</span>
        </>
      }
      copy="Lock it in and get back to work. Urgent dogs don't wait for anyone."
    >
      <h2 className="text-3xl font-black uppercase tracking-tight text-[#f8f1e8] sm:text-4xl">
        Set new password
      </h2>
      <p className="mt-2 text-sm text-[#f8f1e8]/60">
        Choose a strong password for your account.
      </p>

      {error && <div className={`${authErrorClass} mt-6`}>{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className={authLabelClass}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className={authInputClass}
          />
        </div>
        <div>
          <label className={authLabelClass}>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className={authInputClass}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Updating...' : 'Update Password'}
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
