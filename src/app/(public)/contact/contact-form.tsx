'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const subjectOptions = [
  'General question',
  'Shelter question',
  'Rescue question',
  'Technical issue',
  'Other',
] as const;

const inputClass =
  "w-full border border-white/10 bg-[#0b140e] px-4 py-3 text-sm text-[#f8f1e8] placeholder-[#f8f1e8]/30 outline-none transition-all focus:border-[#c08a3e] focus:ring-1 focus:ring-[#c08a3e] [&>option]:bg-[#122016]";
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/50";

export default function ContactForm() {
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

  if (success) {
    return (
      <div className="border border-white/10 bg-[#122016] p-10 text-center sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#c08a3e] text-[#140a08]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-3 text-3xl font-black uppercase tracking-tight text-[#c08a3e]">Message sent.</h2>
        <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[#f8f1e8]/60">
          Thanks for reaching out. We&apos;ll get back to you at <strong className="text-[#f8f1e8]">{email}</strong> as soon as possible.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center border-2 border-[#f8f1e8]/30 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#f8f1e8] transition hover:border-[#c08a3e] hover:text-[#c08a3e]"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#122016] p-6 sm:p-10">
      {error && (
        <div role="alert" className="mb-6 border border-[#a8583f]/40 bg-[#a8583f]/10 p-4 text-sm font-bold text-[#c98a7a]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass}>Name</label>
            <input id="contact-name" name="name" type="text" required placeholder="Your name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>Email</label>
            <input id="contact-email" name="email" type="email" required placeholder="you@org.org" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="contact-subject" className={labelClass}>Subject</label>
          <select id="contact-subject" name="subject" required defaultValue="" className={inputClass}>
            <option value="">Select a topic</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClass}>Message</label>
          <textarea id="contact-message" name="message" required rows={6} placeholder="How can we help you?" className={inputClass} />
        </div>
        <Button type="submit" disabled={loading} className="w-full py-4">
          {loading ? 'Sending...' : 'Send message'}
        </Button>
      </form>
    </div>
  );
}
