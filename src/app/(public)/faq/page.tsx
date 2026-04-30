'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#13241d]/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between py-5 text-left focus:outline-none"
      >
        <span className="font-black text-[#13241d] text-base group-hover:text-[#d95f4b] transition-colors">
          {question}
        </span>
        <span className="ml-4 text-[#f4b942] text-lg font-black shrink-0">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-5">
          <p className="text-sm leading-7 text-[#5d6a64]">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const faqs = [
    {
      question: "How can a dog shelter join DOGSRUN?",
      answer: "Shelters can join by registering on our registration page. Once approved, you can log in to add dogs, manage profiles, and track rescue interest in real time."
    },
    {
      question: "How do rescues receive notifications about available dogs?",
      answer: "Rescues set their matching criteria once — breed preferences, size, age, location. DOGSRUN automatically checks every new dog against your criteria and sends an instant email alert when there's a match. No manual searching needed."
    },
    {
      question: "How does the matching work?",
      answer: "When a shelter adds a dog, DOGSRUN checks all active rescue organizations' saved criteria. Any rescue whose criteria match the dog's breed, age, weight, sex, and mix status receives an email alert instantly."
    },
    {
      question: "Can shelters update dog information after submission?",
      answer: "Yes. Shelters can log in anytime to update health status, photos, descriptions, or mark a dog as adopted, transferred, or deceased."
    },
    {
      question: "Is there a fee to join DOGSRUN?",
      answer: "DOGSRUN is completely free for all registered shelters and rescue organizations. Our goal is to save lives through collaboration, not profit."
    },
    {
      question: "What happens when a rescue clicks Interested?",
      answer: "The shelter receives an email notification with the rescue organization's name and contact email so they can coordinate the pull directly."
    },
    {
      question: "How is shelter and rescue data protected?",
      answer: "We use secure authentication and encrypted connections to keep all organization data confidential. Passwords are never stored in plain text."
    },
    {
      question: "Who do I contact for help?",
      answer: "Reach out via our contact page at dogsrun.org/contact or email us at admin@dogsrun.org. We're a small nonprofit team and will get back to you as soon as possible."
    }
  ];

  return (
    <div className="bg-[#f5f0e8] text-[#13241d]">
      {/* Hero */}
      <header className="bg-[#13241d] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
            Support
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl">
            Frequently asked questions
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c8d3ce]">
            Answers to common questions about joining DOGSRUN, managing shelter dog profiles, and receiving rescue notifications.
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="bg-[#fff9ef] border border-[#13241d]/10 p-8">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 border-l-4 border-[#f59e0b] bg-[#13241d] p-8 text-center text-[#f8f1e8]">
          <h3 className="text-xl font-black text-[#f4b942] mb-3">Still have questions?</h3>
          <p className="text-sm text-[#c8d3ce] mb-6">We&apos;re happy to help.</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-[#f4b942] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]"
          >
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
