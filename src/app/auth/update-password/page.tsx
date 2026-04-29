'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — exchanging it sets the session
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
      <div className="min-h-screen bg-white">
        <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Set new password</h1>
          </div>
        </header>
        <main className="py-8 px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-[#6b7280] text-sm">Verifying your reset link...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Set new password</h1>
          <p className="text-[#6b7280]">Choose a new password for your account</p>
        </div>
      </header>
      <main className="py-8 px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#111] text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
