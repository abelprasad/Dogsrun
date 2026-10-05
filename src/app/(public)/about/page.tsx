import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";

const heroPhoto =
  "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1600";

const stripPhotos = [
  {
    src: "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Rescue puppy resting its head",
  },
  {
    src: "https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Dog looking up at the camera",
  },
  {
    src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Two puppies playing together",
  },
];

const steps = [
  {
    n: "01",
    title: "Intake",
    copy: "Shelters publish the essential context: behavior notes, timeline, size, medical flags, and transfer constraints. One case, entered once, seen by every rescue that fits.",
    accent: "text-[#c08a3e]",
  },
  {
    n: "02",
    title: "Match",
    copy: "DOGSRUN compares each case against active rescue criteria — breed, size, age, geography, capacity — and surfaces the organizations most likely to say yes.",
    accent: "text-[#a8583f]",
  },
  {
    n: "03",
    title: "Move",
    copy: "Rescues get a focused alert with one-click response links, and the shelter hears back fast. No spreadsheets, no phone tag — just the handoff, at speed.",
    accent: "text-[#f8f1e8]",
  },
];

const orgFacts: [string, string[]][] = [
  ["Organization", ["Dog Shelter & Rescue Unification Network, LLC", "501(c)(3) Public Charity"]],
  ["Nonprofit ID", ["EIN 993286395"]],
  ["Mailing Address", ["221 W 9th St #896", "Wilmington, DE 19801"]],
  ["Phone", ["(904) 923-4441"]],
];

const tickerPhrases = ["Every second counts", "Shelter to rescue", "One click to respond"];

export default async function AboutPage() {
  // Live count of dogs with a clock on them, for the hero badge + stats.
  const { count } = await supabaseAdmin
    .from("dogs")
    .select("id", { count: "exact", head: true })
    .in("status", ["available", "urgent"])
    .not("euthanasia_date", "is", null);

  const onTheClock = count ?? 0;

  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HERO: photography-led, oversized type ── */}
      <section className="relative flex min-h-[92svh] flex-col overflow-hidden">
        <Image
          src={heroPhoto}
          alt="Rescue puppy looking up"
          fill
          className="object-cover object-center"
          sizes="100vw"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e] via-[#0b140e]/40 to-[#0b140e]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b140e]/70 via-transparent to-transparent" />

        <div className="relative flex flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20 lg:px-16">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            Our mission
            {onTheClock > 0 && (
              <Link
                href="/dogs?urgency=urgent"
                className="border border-[#a8583f]/60 px-2 py-1 text-[#c98a7a] transition hover:bg-[#a8583f] hover:text-white"
              >
                {onTheClock} on the clock right now
              </Link>
            )}
          </div>

          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#f8f1e8]">Thousands die</span>
            <span className="block text-[clamp(3rem,10vw,9rem)] text-[#c08a3e]">waiting.</span>
            <span className="text-outline block text-[clamp(3rem,10vw,9rem)]">We cut the wait.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-[#f8f1e8]/85">
            DOGSRUN is the shelter-to-rescue handoff rebuilt for speed: real-time
            matching, one-click rescue response, and alerts that land before the
            clock runs out.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
            >
              Join the run
            </Link>
            <Link
              href="/dogs"
              className="inline-flex items-center justify-center border-2 border-[#f8f1e8]/30 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#f8f1e8] transition hover:border-[#c08a3e] hover:text-[#c08a3e]"
            >
              Meet the dogs
            </Link>
          </div>
        </div>
      </section>

      {/* ── URGENCY MARQUEE ── */}
      <div className="relative overflow-hidden border-y-2 border-[#a8583f] bg-[#a8583f] py-3" aria-hidden>
        <div className="animate-marquee flex w-max items-center gap-10 pr-10">
          {[...tickerPhrases, ...tickerPhrases, ...tickerPhrases, ...tickerPhrases].map((p, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-10 whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-[#140a08]"
            >
              {p} <span className="text-[#140a08]/40">{'///'}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── MISSION: oversized editorial statement ── */}
      <section className="px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a8583f]">Why we exist</p>
          <p className="mt-6 max-w-5xl font-serif text-[clamp(1.8rem,4.5vw,3.75rem)] font-bold leading-[1.15] text-[#f8f1e8]">
            The dogs aren&apos;t the problem. <span className="text-[#c08a3e]">The handoff is.</span>{" "}
            Shelters are full, rescues are willing — and the gap between them is
            measured in days a dog doesn&apos;t have.
          </p>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <p className="text-base leading-8 text-[#f8f1e8]/65">
              At DOGSRUN, we bring dog shelters and rescue organizations together
              in one network. Shelters share detailed information about dogs in
              need; rescues receive timely notifications tailored to their
              adoption criteria. No more cases falling through the cracks of a
              shared inbox.
            </p>
            <p className="text-base leading-8 text-[#f8f1e8]/65">
              We are committed to improving the lives of shelter dogs by building
              the collaborative network that reduces overcrowding and gets more
              dogs into loving homes — faster than the clock allows for now.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-10">
            {[
              [String(onTheClock), "dogs on the clock right now"],
              ["50+", "states in the network"],
              ["1-click", "rescue response"],
            ].map(([big, small]) => (
              <div key={small}>
                <p className="text-5xl font-black tracking-tight text-[#c08a3e]">{big}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#f8f1e8]/50">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: staggered editorial cards ── */}
      <section className="border-t border-white/10 px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a8583f]">The playbook</p>
          <h2 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.9] tracking-tight">
            Three moves.<br />Zero <span className="text-[#c08a3e]">dead time.</span>
          </h2>

          <div className="mt-14 grid gap-6 lg:grid-cols-12">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`relative overflow-hidden border border-white/10 bg-[#122016] p-8 sm:p-10 ${
                  i === 0
                    ? "lg:col-span-5"
                    : i === 1
                      ? "lg:col-span-7 lg:mt-16"
                      : "lg:col-span-6 lg:col-start-4 lg:-mt-4"
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -right-4 -top-8 select-none text-[9rem] font-black leading-none opacity-15 sm:text-[12rem] ${step.accent}`}
                >
                  {step.n}
                </span>
                <p className={`text-sm font-black uppercase tracking-[0.3em] ${step.accent}`}>Step {step.n}</p>
                <h3 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">{step.title}</h3>
                <p className="mt-5 max-w-md text-base leading-8 text-[#f8f1e8]/70">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ── */}
      <section className="border-t border-white/10 px-5 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
          {stripPhotos.map((p, i) => (
            <div key={i} className="relative h-56 overflow-hidden border border-white/10 sm:h-64">
              <Image src={p.src} alt={p.alt} fill className="object-cover" unoptimized sizes="(min-width: 768px) 33vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e]/50 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* ── NONPROFIT INFO ── */}
      <section className="border-t border-white/10 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="border border-white/10 bg-[#122016] p-8 sm:p-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">The fine print</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.92] tracking-tight">
              Nonprofit. <span className="text-[#c08a3e]">For real.</span>
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {orgFacts.map(([label, lines]) => (
                <div key={label}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f8f1e8]/40">{label}</p>
                  {lines.map((line, i) => (
                    <p key={i} className={`text-sm ${i === 0 ? "font-black text-[#f8f1e8]" : "text-[#f8f1e8]/60"}`}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="border-t border-white/10 px-5 py-20 text-center sm:px-10 sm:py-28 lg:px-16">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#a8583f]">Pick your lane</p>
        <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(2.75rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-tight">
          <span className="text-outline">Ready to</span> <span className="text-[#c08a3e]">move?</span>
        </h2>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register?type=shelter"
            className="inline-flex items-center justify-center bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
          >
            Register shelter
          </Link>
          <Link
            href="/register?type=rescue"
            className="inline-flex items-center justify-center bg-[#a8583f] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#f05a4a]"
          >
            Register rescue
          </Link>
        </div>
      </section>
    </div>
  );
}
