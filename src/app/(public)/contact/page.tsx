import Link from 'next/link';
import ContactForm from './contact-form';
import { ADMIN_EMAIL } from '@/lib/constants'
import { ORG } from '@/lib/site-content'

// M-F10: server component for static hero + info rail; interactive form is a client island.
export default function ContactPage() {
  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HERO ── */}
      <header className="px-5 pb-16 pt-24 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            Get in touch
          </div>
          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#f8f1e8]">Say it</span>
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#c08a3e]">fast.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#f8f1e8]/70">
            Question, bug report, partnership, press — it lands in a human inbox.
            We reply as fast as we can.
          </p>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Info rail */}
          <aside className="lg:col-span-1">
            <div className="border-l-4 border-[#a8583f] bg-[#122016] p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#c08a3e]">Email</h3>
                  <a href={`mailto:${ADMIN_EMAIL}`} className="text-lg font-black text-[#f8f1e8] hover:text-[#c08a3e] hover:underline">
                    {ADMIN_EMAIL}
                  </a>
                </div>
                <div>
                  <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#c08a3e]">Phone</h3>
                  <a href={ORG.phoneHref} className="text-lg font-black text-[#f8f1e8] hover:text-[#c08a3e]">
                    {ORG.phone}
                  </a>
                </div>
                <div>
                  <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#c08a3e]">Mailing address</h3>
                  <div className="text-sm leading-7 text-[#f8f1e8]/60">
                    <p className="font-black text-[#f8f1e8]">{ORG.legalName}</p>
                    {ORG.addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">
                    501(c)(3) nonprofit · EIN {ORG.ein}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
