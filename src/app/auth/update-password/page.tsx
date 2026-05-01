'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
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
      <div className="min-h-screen bg-[#f5f0e8]">
        <header className="bg-[#13241d] py-12 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">DOGSRUN</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Set New Password</h1>
          </div>
        </header>
        <main className="py-16 px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-10 text-center">
            <p className="text-[#5d6a64] text-sm">Verifying your reset link...</p>
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Set New Password</h1>
          <p className="text-[#f5f0e8]/60 mt-3 text-sm">Choose a new password for your account</p>
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
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#13241d] focus:ring-0 outline-none transition-colors text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.24em] font-bold text-[#13241d] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#13241d] focus:ring-0 outline-none transition-all text-[#13241d] placeholder-[#5d6a64]/40 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#13241d] text-[#f4b942] text-xs uppercase tracking-[0.24em] font-bold hover:bg-[#1a2e1a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
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
