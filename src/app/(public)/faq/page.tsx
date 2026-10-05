import Link from "next/link";

interface FAQItemProps {
  index: number;
  question: string;
  answer: string;
}

function FAQItem({ index, question, answer }: FAQItemProps) {
  return (
    <details className="group border-b border-white/10">
      <summary className="flex w-full cursor-pointer list-none items-center gap-5 py-6 focus:outline-none sm:gap-6 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-sm font-black tracking-[0.2em] text-[#a8583f]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-base font-black uppercase tracking-tight text-[#f8f1e8] transition-colors group-hover:text-[#c08a3e] sm:text-xl">
          {question}
        </span>
        <span className="shrink-0 text-2xl font-black text-[#c08a3e] group-open:hidden">+</span>
        <span className="hidden shrink-0 text-2xl font-black text-[#c08a3e] group-open:block">−</span>
      </summary>
      <div className="pb-7 pl-9 sm:pl-11">
        <p className="max-w-3xl text-base leading-8 text-[#f8f1e8]/65">{answer}</p>
      </div>
    </details>
  );
}

const faqs = [
  {
    question: "How can a dog shelter join DOGSRUN?",
    answer:
      "Shelters can join by registering on our registration page. Once approved, you can log in to add dogs, manage profiles, and track rescue interest in real time.",
  },
  {
    question: "How do rescues receive notifications about available dogs?",
    answer:
      "Rescues set their matching criteria once — breed preferences, size, age, location. DOGSRUN automatically checks every new dog against your criteria and sends an instant email alert when there's a match. No manual searching needed.",
  },
  {
    question: "How does the matching work?",
    answer:
      "When a shelter adds a dog, DOGSRUN checks all active rescue organizations' saved criteria. Any rescue whose criteria match the dog's breed, age, weight, sex, and mix status receives an email alert instantly.",
  },
  {
    question: "Can shelters update dog information after submission?",
    answer:
      "Yes. Shelters can log in anytime to update health status, photos, descriptions, or mark a dog as adopted, transferred, or deceased.",
  },
  {
    question: "Is there a fee to join DOGSRUN?",
    answer:
      "DOGSRUN is completely free for all registered shelters and rescue organizations. Our goal is to save lives through collaboration, not profit.",
  },
  {
    question: "What happens when a rescue clicks Interested?",
    answer:
      "The shelter receives an email notification with the rescue organization's name and contact email so they can coordinate the pull directly.",
  },
  {
    question: "How is shelter and rescue data protected?",
    answer:
      "We use secure authentication and encrypted connections to keep all organization data confidential. Passwords are never stored in plain text.",
  },
  {
    question: "Who do I contact for help?",
    answer:
      "Reach out via our contact page at dogsrun.org/contact or email us at admin@dogsrun.org. We're a small nonprofit team and will get back to you as soon as possible.",
  },
];

export default function FAQPage() {
  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HERO ── */}
      <header className="px-5 pb-16 pt-24 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            Support
          </div>
          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#f8f1e8]">Questions?</span>
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#c08a3e]">Good.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#f8f1e8]/70">
            Straight answers about joining, matching, and what happens when a
            rescue clicks Interested. No fluff — the clock is ticking.
          </p>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="border-t-2 border-[#c08a3e]">
              {faqs.map((faq, i) => (
                <FAQItem key={i} index={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Sticky help rail */}
          <aside className="lg:col-span-1">
            <div className="card-craft p-8 lg:sticky lg:top-24">
              <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#a8583f]">
                <span className="animate-pulse-dot h-2 w-2 rounded-full bg-[#a8583f]" />
                Still stuck?
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-[0.92] tracking-tight">
                Talk to a<br />human.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#f8f1e8]/60">
                We&apos;re a small nonprofit team. Every message lands in a real
                inbox, and we reply as fast as we can.
              </p>
              <Link
                href="/contact"
                className="mt-7 inline-flex w-full items-center justify-center bg-[#c08a3e] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
              >
                Contact us
              </Link>
              <a
                href="mailto:admin@dogsrun.org"
                className="mt-4 block text-center text-sm font-bold text-[#c08a3e] hover:underline"
              >
                admin@dogsrun.org
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
