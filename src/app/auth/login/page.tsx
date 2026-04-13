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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600">We sent a magic link to <strong>{email}</strong></p>
          <p className="text-gray-500 text-sm mt-2">Click the link to sign in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-bold text-[#f59e0b] mb-4 inline-block">DOGSRUN</Link>
          <p className="text-gray-500">Sign in to your shelter or rescue account</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shelter.org"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#f59e0b] text-white font-bold rounded-xl shadow-lg hover:bg-[#d97706] disabled:opacity-50 transform transition active:scale-95"
            >
              {loading ? 'Signing in...' : mode === 'password' ? 'Sign in' : 'Send magic link'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'password' ? 'magic' : 'password'); setError(null) }}
              className="text-sm text-gray-500 hover:text-[#f59e0b] transition-colors"
            >
              {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#f59e0b] font-bold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}