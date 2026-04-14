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
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none group"
      >
        <span className="font-semibold text-[#111] text-base group-hover:text-[#f59e0b] transition-colors">
          {question}
        </span>
        <span className="text-[#9ca3af] text-xl ml-4">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            {answer}
          </p>
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
      answer: "Reach out via our contact page at dogsrun.net/contact or email us at admin@dogsrun.org. We're a small nonprofit team and will get back to you as soon as possible."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-4">
            Frequently asked questions
          </h1>
          <p className="text-base text-[#6b7280] max-w-2xl leading-relaxed">
            Answers to common questions about joining DOGSRUN, managing shelter dog profiles, and receiving rescue notifications.
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="py-12 px-8 max-w-3xl mx-auto">
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* CTA box */}
        <div className="bg-[#fffbeb] rounded-xl p-8 text-center mt-12 border border-gray-100">
          <h3 className="text-xl font-bold text-[#111] mb-4">Still have questions? We&apos;re happy to help.</h3>
          <Link 
            href="/contact" 
            className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d97706] transition-colors"
          >
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
