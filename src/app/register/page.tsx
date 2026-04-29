'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import StateSelect from '@/components/state-select';

function RegisterForm() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [type, setType] = useState<'shelter' | 'rescue'>(
    typeParam === 'rescue' ? 'rescue' : 'shelter'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [taxDoc, setTaxDoc] = useState<File | null>(null);
  const [taxDocError, setTaxDocError] = useState<string | null>(null);

  useEffect(() => {}, [typeParam]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTaxDocError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) { setTaxDoc(null); return; }
    if (file.type !== 'application/pdf') {
      setTaxDocError('Please upload a PDF file.');
      setTaxDoc(null);
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTaxDocError('File must be under 10MB.');
      setTaxDoc(null);
      e.target.value = '';
      return;
    }
    setTaxDoc(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailVal = formData.get('email') as string;
    const password = formData.get('password') as string;
    const orgName = formData.get('orgName') as string;
    const city = formData.get('city') as string;
    setEmail(emailVal);

    if (!state) {
      setError('Please select a state.');
      setLoading(false);
      return;
    }

    if (!taxDoc) {
      setError('Please upload your 501(c)(3) determination letter.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailVal,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
        const apiFormData = new FormData();
        apiFormData.append('user_id', authData.user.id);
        apiFormData.append('name', orgName);
        apiFormData.append('email', emailVal);
        apiFormData.append('city', city);
        apiFormData.append('state', state);
        apiFormData.append('type', type);
        if (taxDoc) {
          apiFormData.append('tax_doc', taxDoc);
        }

      const res = await fetch('/api/register', {
        method: 'POST',
        body: apiFormData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? 'Failed to create organization');
        setLoading(false);
        return;
      }

      await supabase.auth.signInWithOtp({
        email: emailVal,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setSuccess(true);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#111] mb-2">Check your email</h2>
        {type === 'rescue' ? (
        <p className="text-[#6b7280] mb-4">
        We&apos;ve sent a login link to <strong>{email}</strong>. Once you confirm your email, your application will be reviewed by our team. We&apos;ll notify you when you&apos;re approved.
        </p>
        ) : (
        <p className="text-[#6b7280] mb-4">
        We&apos;ve sent a login link to <strong>{email}</strong>. Once you confirm your email, your application will be reviewed by our team. We&apos;ll notify you when you&apos;re approved.
        </p>
        )}
        <Link href="/auth/login" className="text-[#f59e0b] font-bold hover:underline">Back to login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setType('shelter')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'shelter' ? 'bg-[#f59e0b] text-[#451a03]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}
          >
            Shelter
          </button>
          <button
            type="button"
            onClick={() => setType('rescue')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'rescue' ? 'bg-[#f59e0b] text-[#451a03]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}
          >
            Rescue
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
            <input
              name="orgName"
              type="text"
              required
              placeholder={type === 'shelter' ? 'City Animal Shelter' : 'Golden Retriever Rescue'}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                name="city"
                type="text"
                required
                placeholder="Philadelphia"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <StateSelect value={state} onChange={setState} placeholder="Select state..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="director@org.org"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
            />
          </div>

          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                501(c)(3) Determination Letter <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#9ca3af] mb-2">PDF only · Max 10MB</p>
              <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                taxDoc
                  ? 'border-[#f59e0b] bg-[#fffbeb]'
                  : 'border-gray-200 hover:border-[#f59e0b] bg-gray-50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 ${taxDoc ? 'text-[#f59e0b]' : 'text-[#9ca3af]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className={`text-sm flex-1 truncate ${taxDoc ? 'text-[#111] font-semibold' : 'text-[#9ca3af]'}`}>
                  {taxDoc ? taxDoc.name : 'Click to upload PDF'}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {taxDocError && (
                <p className="text-red-600 text-xs mt-1">{taxDocError}</p>
              )}
            </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#111] text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : `Register as ${type === 'shelter' ? 'Shelter' : 'Rescue'}`}
          </button>
        </form>
      </div>

      <p className="text-center mt-8 text-[#6b7280] text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#f59e0b] font-bold hover:underline">Login</Link>
      </p>
    </div>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  return (
    <main className="py-8 px-8 flex items-center justify-center">
      <Suspense fallback={<div className="text-[#6b7280] font-medium">Loading...</div>}>
        <RegisterForm key={typeParam || 'default'} />
      </Suspense>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">Join the network</h1>
          <p className="text-[#6b7280]">Help us save more dogs, faster.</p>
        </div>
      </header>
      <Suspense fallback={<div className="text-[#6b7280] font-medium text-center py-20">Loading...</div>}>
        <RegisterPageContent />
      </Suspense>
    </div>
  );
}
