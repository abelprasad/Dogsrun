'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import StateSelect from '@/components/state-select'

type Step = 'idle' | 'creating-account' | 'uploading-doc' | 'saving' | 'sending-email'

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  'creating-account': 'Creating account...',
  'uploading-doc': 'Uploading document...',
  saving: 'Saving organization...',
  'sending-email': 'Almost done...',
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const [type, setType] = useState<'shelter' | 'rescue'>(typeParam === 'rescue' ? 'rescue' : 'shelter')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [taxDoc, setTaxDoc] = useState<File | null>(null)
  const [taxDocError, setTaxDocError] = useState<string | null>(null)

  const loading = step !== 'idle'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTaxDocError(null)
    const file = e.target.files?.[0] ?? null
    if (!file) { setTaxDoc(null); return }
    if (file.type !== 'application/pdf') {
      setTaxDocError('Please upload a PDF file.')
      setTaxDoc(null)
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setTaxDocError('File must be under 10MB.')
      setTaxDoc(null)
      e.target.value = ''
      return
    }
    setTaxDoc(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const emailVal = formData.get('email') as string
    const password = formData.get('password') as string
    const orgName = formData.get('orgName') as string
    const city = formData.get('city') as string
    setEmail(emailVal)

    if (!state) { setError('Please select a state.'); return }
    if (!taxDoc) { setError('Please upload your 501(c)(3) determination letter.'); return }

    const supabase = createClient()

    // Step 1 — create auth account
    setStep('creating-account')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailVal,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Failed to create account')
      setStep('idle')
      return
    }

    // Step 2 — upload PDF directly from browser to Supabase Storage.
    // Doing this client-side avoids Vercel's 10s function timeout on slow mobile connections.
    setStep('uploading-doc')
    const filePath = `${authData.user.id}/501c3.pdf`
    const { error: uploadError } = await supabase.storage
      .from('tax-docs')
      .upload(filePath, taxDoc, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      setError('Failed to upload document. Check your connection and try again.')
      setStep('idle')
      return
    }

    // Step 3 — register org (JSON body, path only — no file)
    setStep('saving')
    let res: Response
    try {
      res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: authData.user.id,
          name: orgName,
          email: emailVal,
          city,
          state,
          type,
          tax_doc_path: filePath,
        }),
      })
    } catch {
      setError('Network error. Please check your connection and try again.')
      setStep('idle')
      return
    }

    const result = await res.json()
    if (!res.ok) {
      setError(result.error ?? 'Failed to create organization')
      setStep('idle')
      return
    }

    // Step 4 — send magic link
    setStep('sending-email')
    await supabase.auth.signInWithOtp({
      email: emailVal,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setSuccess(true)
    setStep('idle')
  }

  const inputClass = "w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#f4b942] focus:ring-1 focus:ring-[#f4b942] outline-none transition-all text-[#13241d] placeholder-[#9ca3af] text-base sm:text-sm"

  if (success) {
    return (
      <div className="max-w-md w-full border border-[#13241d]/10 bg-[#fff9ef] p-8 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4b942] text-[#13241d]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#13241d] mb-2">Check your email</h2>
        <p className="text-[#5d6a64] mb-6">
          We&apos;ve sent a login link to <strong>{email}</strong>. Once you confirm your email, your application will be reviewed by our team. We&apos;ll notify you when you&apos;re approved.
        </p>
        <Link href="/auth/login" className="text-[#d95f4b] font-black hover:underline text-sm uppercase tracking-widest">Back to login</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full">
      <div className="border border-[#13241d]/10 bg-[#fff9ef] overflow-hidden">
        {/* Type toggle */}
        <div className="flex border-b border-[#13241d]/10">
          {(['shelter', 'rescue'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              disabled={loading}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-[0.16em] transition-colors ${
                type === t
                  ? 'bg-[#f4b942] text-[#13241d]'
                  : 'bg-[#fff9ef] text-[#7a877f] hover:text-[#13241d]'
              } disabled:opacity-50`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Organization Name</label>
            <input name="orgName" type="text" required placeholder={type === 'shelter' ? 'City Animal Shelter' : 'Golden Retriever Rescue'} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">City</label>
              <input name="city" type="text" required placeholder="Philadelphia" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">State</label>
              <StateSelect value={state} onChange={setState} placeholder="Select..." />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Work Email</label>
            <input name="email" type="email" required placeholder="director@org.org" autoComplete="email" inputMode="email" className={inputClass} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Password</label>
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">
              501(c)(3) Determination Letter <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[#9ca3af] mb-2">PDF only · Max 10MB</p>
            <label className={`flex cursor-pointer items-center gap-3 border-2 border-dashed px-4 py-4 transition-colors ${taxDoc ? 'border-[#f4b942] bg-[#fffbeb]' : 'border-[#13241d]/20 hover:border-[#f4b942] bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 shrink-0 ${taxDoc ? 'text-[#f4b942]' : 'text-[#9ca3af]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`flex-1 truncate text-sm ${taxDoc ? 'font-black text-[#13241d]' : 'text-[#9ca3af]'}`}>
                {taxDoc ? taxDoc.name : 'Tap to upload PDF'}
              </span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
            {taxDocError && <p className="mt-1 text-xs text-red-600">{taxDocError}</p>}
          </div>

          {/* Step progress indicator */}
          {loading && (
            <div className="flex items-center gap-3 py-1">
              <svg className="h-4 w-4 shrink-0 animate-spin text-[#f4b942]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-bold text-[#5d6a64]">{STEP_LABELS[step]}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f4b942] py-4 text-sm font-black uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? STEP_LABELS[step] : `Register as ${type === 'shelter' ? 'Shelter' : 'Rescue'}`}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-[#5d6a64]">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-black text-[#d95f4b] hover:underline">Login</Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Join the network
          </div>
          <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl">
            Join the network
          </h1>
          <p className="mt-4 text-lg text-[#c8d3ce]">Help us save more dogs, faster.</p>
        </div>
      </header>
      <main className="px-5 py-12 flex items-start justify-center sm:px-8 lg:px-12">
        <Suspense fallback={<div className="text-[#5d6a64] font-medium">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  )
}
