'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function RegisterPage() {
  const [type, setType] = useState<'shelter' | 'rescue'>('shelter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const orgName = formData.get('orgName') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;

    const supabase = createClient();

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create the organization profile
      const { error: profileError } = await supabase.from('organizations').insert({
        id: authData.user.id,
        name: orgName,
        email: email,
        city: city,
        state: state,
        type: type,
      });

      if (profileError) {
        setError(profileError.message);
      } else {
        setSuccess(true);
      }
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#f59e0b]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600 mb-8">We've sent a confirmation link to your email address. Please verify your account to continue.</p>
          <Link href="/auth/login" className="text-[#f59e0b] font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-bold text-[#f59e0b] mb-4 inline-block">DOGSRUN</Link>
          <h1 className="text-2xl font-bold text-gray-900">Join the network</h1>
          <p className="text-gray-600 mt-2">Help us save more dogs, faster.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setType('shelter')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${type === 'shelter' ? 'text-[#f59e0b] border-b-2 border-[#f59e0b] bg-amber-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Shelter
            </button>
            <button
              onClick={() => setType('rescue')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${type === 'rescue' ? 'text-[#f59e0b] border-b-2 border-[#f59e0b] bg-amber-50/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rescue
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
              <input
                name="orgName"
                type="text"
                required
                placeholder={type === 'shelter' ? 'City Animal Shelter' : 'Golden Retriever Rescue'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  name="city"
                  type="text"
                  required
                  placeholder="Austin"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  name="state"
                  type="text"
                  required
                  placeholder="TX"
                  maxLength={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="director@org.org"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#f59e0b] focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#f59e0b] text-white font-bold rounded-xl shadow-lg hover:bg-[#d97706] disabled:opacity-50 transform transition active:scale-95"
            >
              {loading ? 'Creating account...' : `Register as ${type === 'shelter' ? 'Shelter' : 'Rescue'}`}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#f59e0b] font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
