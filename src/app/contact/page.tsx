'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setEmail(data.email as string);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to send message');
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again or email us at admin@dogsrun.org');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
            Contact us
          </h1>
          <p className="text-base text-[#6b7280] max-w-2xl leading-relaxed">
            Have a question or need help? We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="py-12 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left column: Form */}
          <div className="md:col-span-2">
            {success ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#111] mb-2">Message sent!</h2>
                <p className="text-[#6b7280] mb-8">Thanks for reaching out. We&apos;ll get back to you at <strong>{email}</strong> as soon as possible.</p>
                <Link 
                  href="/" 
                  className="inline-block bg-[#111] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-black transition-colors"
                >
                  Back to home
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@org.org"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <select
                      name="subject"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] bg-white text-sm"
                    >
                      <option value="">Select a topic</option>
                      <option value="General question">General question</option>
                      <option value="Shelter question">Shelter question</option>
                      <option value="Rescue question">Rescue question</option>
                      <option value="Technical issue">Technical issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all text-[#111] placeholder-[#9ca3af] text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg hover:bg-[#d97706] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right column: Info */}
          <div className="md:col-span-1">
            <div className="bg-[#fafaf9] border border-gray-100 rounded-xl p-6 space-y-8">
              <div>
                <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Get in touch</h3>
                <p className="mb-2">
                  <a href="mailto:admin@dogsrun.org" className="text-[#f59e0b] font-bold hover:underline">admin@dogsrun.org</a>
                </p>
                <p className="text-sm text-[#6b7280] font-medium">(904) 923-4441</p>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-4">Mailing address</h3>
                <div className="text-sm text-[#6b7280] leading-relaxed space-y-1">
                  <p className="font-bold text-[#111]">Dog Shelter & Rescue Unification Network, LLC</p>
                  <p>221 W 9th St #896</p>
                  <p>Wilmington, DE 19801</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-[10px] text-[#9ca3af] leading-tight font-medium uppercase tracking-wider">
                  DOGSRUN is a 501(c)(3) nonprofit. EIN 993286395.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
