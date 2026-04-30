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

  const inputClass = "w-full px-4 py-3 border border-[#13241d]/20 bg-white focus:border-[#f4b942] focus:ring-1 focus:ring-[#f4b942] outline-none transition-all text-[#13241d] placeholder-[#9ca3af] text-sm";

  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      {/* Hero */}
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Get in touch
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl">
            Contact us
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c8d3ce]">
            Have a question or need help? We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Form */}
          <div className="md:col-span-2">
            {success ? (
              <div className="border border-[#13241d]/10 bg-[#fff9ef] p-12 text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4b942] text-[#13241d]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-[#13241d] mb-2">Message sent!</h2>
                <p className="text-[#5d6a64] mb-8">Thanks for reaching out. We&apos;ll get back to you at <strong>{email}</strong> as soon as possible.</p>
                <Link href="/" className="inline-flex items-center justify-center bg-[#13241d] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#f8f1e8] transition hover:bg-[#1e3a2e]">
                  Back to home
                </Link>
              </div>
            ) : (
              <div className="border border-[#13241d]/10 bg-[#fff9ef] p-8">
                {error && (
                  <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Name</label>
                      <input name="name" type="text" required placeholder="Your name" className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Email</label>
                      <input name="email" type="email" required placeholder="you@org.org" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Subject</label>
                    <select name="subject" required className={inputClass}>
                      <option value="">Select a topic</option>
                      <option value="General question">General question</option>
                      <option value="Shelter question">Shelter question</option>
                      <option value="Rescue question">Rescue question</option>
                      <option value="Technical issue">Technical issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">Message</label>
                    <textarea name="message" required rows={5} placeholder="How can we help you?" className={inputClass} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f4b942] py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a] disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Info sidebar */}
          <div className="md:col-span-1">
            <div className="border-l-4 border-[#f59e0b] bg-[#13241d] p-8 text-[#f8f1e8] space-y-8">
              <div>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4b942]">Email</h3>
                <a href="mailto:admin@dogsrun.org" className="font-black text-[#f4b942] hover:underline">admin@dogsrun.org</a>
              </div>
              <div>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4b942]">Phone</h3>
                <p className="font-black text-[#f8f1e8]">(904) 923-4441</p>
              </div>
              <div>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4b942]">Mailing address</h3>
                <div className="text-sm leading-7 text-[#c8d3ce]">
                  <p className="font-black text-[#f8f1e8]">Dog Shelter & Rescue Unification Network, LLC</p>
                  <p>221 W 9th St #896</p>
                  <p>Wilmington, DE 19801</p>
                </div>
              </div>
              <div className="border-t border-[#f8f1e8]/10 pt-6">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#7a877f]">
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
