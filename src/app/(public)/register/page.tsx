'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { US_STATES } from '@/lib/us-states'
import { Button } from '@/components/ui'

type Step = 'idle' | 'creating-account' | 'uploading-doc' | 'saving'

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  'creating-account': 'Creating account...',
  'uploading-doc': 'Uploading document...',
  saving: 'Saving organization...',
}

const nextSteps = [
  {
    n: "01",
    title: "Confirm your email",
    copy: "A confirmation link lands in your inbox. Click it — your application only moves forward once your email is verified.",
  },
  {
    n: "02",
    title: "We review your 501(c)(3)",
    copy: "Our small nonprofit team checks your determination letter by hand. No bots deciding whether you're legit.",
  },
  {
    n: "03",
    title: "Get approved, start matching",
    copy: "Once approved, you're in the network: publish dogs, set criteria, and move at the speed the clock demands.",
  },
]

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

    setSuccess(true)
    setStep('idle')
  }

  const inputClass =
    "w-full border border-white/10 bg-[#0b140e] px-4 py-3 text-sm text-[#f8f1e8] placeholder-[#f8f1e8]/30 outline-none transition-all focus:border-[#c08a3e] focus:ring-1 focus:ring-[#c08a3e] [&>option]:bg-[#122016]"
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/50"

  if (success) {
    return (
      <div className="w-full border border-white/10 bg-[#122016] p-8 text-center sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#c08a3e] text-[#140a08]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-3 text-3xl font-black uppercase tracking-tight text-[#c08a3e]">Check your email</h2>
        <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[#f8f1e8]/60">
          We&apos;ve sent a confirmation email to <strong className="text-[#f8f1e8]">{email}</strong>. Click the link in it to confirm your email. Once confirmed, your application will be reviewed by our team. We&apos;ll notify you when you&apos;re approved.
        </p>
        <Link href="/auth/login" className="text-sm font-black uppercase tracking-[0.18em] text-[#c08a3e] hover:underline">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden border border-white/10 bg-[#122016]">
        {/* Type toggle: shelter vs rescue */}
        <div className="grid grid-cols-2 border-b border-white/10">
          {(['shelter', 'rescue'] as const).map((t) => {
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={loading}
                className={`px-4 py-5 text-sm font-black uppercase tracking-[0.18em] transition-colors disabled:opacity-50 sm:py-6 ${
                  active
                    ? t === 'shelter'
                      ? 'bg-[#c08a3e] text-[#140a08]'
                      : 'bg-[#a8583f] text-white'
                    : 'bg-transparent text-[#f8f1e8]/40 hover:text-[#f8f1e8]'
                }`}
              >
                {t === 'shelter' ? 'I run a shelter' : 'I run a rescue'}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
          {error && (
            <div className="border border-[#a8583f]/40 bg-[#a8583f]/10 p-4 text-sm font-bold text-[#c98a7a]">{error}</div>
          )}

          <div>
            <label htmlFor="reg-org" className={labelClass}>Organization name</label>
            <input
              id="reg-org"
              name="orgName"
              type="text"
              required
              placeholder={type === 'shelter' ? 'City Animal Shelter' : 'Golden Retriever Rescue'}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-city" className={labelClass}>City</label>
              <input id="reg-city" name="city" type="text" required placeholder="Philadelphia" className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-state" className={labelClass}>State</label>
              <div className="relative">
                <select
                  id="reg-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="">Select...</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c08a3e]">▾</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className={labelClass}>Work email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              placeholder="director@org.org"
              autoComplete="email"
              inputMode="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className={labelClass}>Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="6+ characters"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              501(c)(3) determination letter <span className="text-[#a8583f]">*</span>
            </label>
            <p className="mb-2 text-xs text-[#f8f1e8]/30">PDF only · Max 10MB</p>
            <label className={`flex cursor-pointer items-center gap-3 border-2 border-dashed px-4 py-4 transition-colors ${taxDoc ? 'border-[#c08a3e] bg-[#c08a3e]/5' : 'border-white/15 hover:border-[#c08a3e] bg-[#0b140e]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 shrink-0 ${taxDoc ? 'text-[#c08a3e]' : 'text-[#f8f1e8]/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`flex-1 truncate text-sm ${taxDoc ? 'font-black text-[#f8f1e8]' : 'text-[#f8f1e8]/30'}`}>
                {taxDoc ? taxDoc.name : 'Tap to upload PDF'}
              </span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
            {taxDocError && <p className="mt-1 text-xs font-bold text-[#c98a7a]">{taxDocError}</p>}
          </div>

          {/* Step progress indicator */}
          {loading && (
            <div className="flex items-center gap-3 py-1">
              <svg className="h-4 w-4 shrink-0 animate-spin text-[#c08a3e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-bold text-[#f8f1e8]/60">{STEP_LABELS[step]}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-4"
          >
            {loading ? STEP_LABELS[step] : `Register as ${type === 'shelter' ? 'shelter' : 'rescue'}`}
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-[#f8f1e8]/50">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-black text-[#c08a3e] hover:underline">Login</Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HERO ── */}
      <header className="px-5 pb-14 pt-24 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            Join the network
          </div>
          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#f8f1e8]">Stop waiting.</span>
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#c08a3e]">Start matching.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#f8f1e8]/70">
            Register your shelter or rescue. Once approved, you&apos;re in the
            network — publish dogs, set criteria, and move at the speed the
            clock demands. Free, forever.
          </p>
        </div>
      </header>

      {/* ── BODY: form + what-happens-next rail ── */}
      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-16">
        <div className="grid items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Suspense fallback={<div className="font-medium text-[#f8f1e8]/50">Loading...</div>}>
              <RegisterForm />
            </Suspense>
          </div>

          <aside className="lg:col-span-2">
            <div className="border border-white/10 bg-[#122016] p-8 lg:sticky lg:top-24">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a8583f]">
                What happens next
              </p>
              <div className="mt-6 space-y-7">
                {nextSteps.map((s) => (
                  <div key={s.n} className="flex gap-5">
                    <span className="shrink-0 text-3xl font-black text-[#c08a3e]">{s.n}</span>
                    <div>
                      <h3 className="font-black uppercase tracking-tight text-[#f8f1e8]">{s.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-[#f8f1e8]/60">{s.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">
                  Free for shelters &amp; rescues — always.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
