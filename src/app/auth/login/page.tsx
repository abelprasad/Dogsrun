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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Look up org type and redirect
      const { data: org } = await supabase
        .from('organizations')
        .select('type')
        .eq('email', email)
        .maybeSingle()
      
      router.push(org?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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
      <div className="min-h-screen bg-white">
        <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
              Check your email
            </h1>
          </div>
        </header>
        <main className="py-8 px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#6b7280] mb-2">We sent a magic link to <strong>{email}</strong></p>
            <p className="text-sm text-[#9ca3af]">Click the link to sign in.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
            Welcome back
          </h1>
          <p className="text-[#6b7280]">Sign in to your shelter or rescue account</p>
        </div>
      </header>

      <main className="py-8 px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@shelter.org"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#111] text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : mode === 'password' ? 'Sign in' : 'Send magic link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
                className="text-xs text-[#9ca3af] hover:text-[#f59e0b] transition-colors uppercase tracking-wider font-bold"
              >
                {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-[#6b7280] text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#f59e0b] font-bold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
