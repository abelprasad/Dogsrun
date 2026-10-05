import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { daysUntilEuthanasia, daysLeftLabel } from "@/lib/urgency";
import UrgentTicker from "@/components/urgent-ticker";

const dogPhotos = {
  hero: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=2000&q=85",
  rescue: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=1600&q=85",
};

const steps = [
  {
    n: "01",
    title: "Intake",
    copy: "Shelters publish the essential context: behavior notes, timeline, size, medical flags, and transfer constraints.",
    accent: "text-[#f4b942]",
  },
  {
    n: "02",
    title: "Match",
    copy: "DOGSRUN compares each case against active rescue criteria and highlights the organizations most likely to say yes.",
    accent: "text-[#e04a3a]",
  },
  {
    n: "03",
    title: "Move",
    copy: "Rescues receive a focused alert with one-click response links so urgent dogs can get out faster.",
    accent: "text-[#f8f1e8]",
  },
];

export default async function Home() {
  // Dogs on the clock: urgent status or a scheduled euthanasia date, soonest first.
  const { data } = await supabaseAdmin
    .from("dogs")
    .select("id, name, breed, photo_url, status, euthanasia_date")
    .in("status", ["available", "urgent"])
    .not("euthanasia_date", "is", null)
    .order("euthanasia_date", { ascending: true })
    .limit(8);

  const onTheClock = (data || [])
    .map((d) => ({ ...d, daysLeft: daysUntilEuthanasia(d.euthanasia_date) }))
    .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

  return (
    <div className="bg-[#0b140e] text-[#f8f1e8]">
      {/* ── IMMERSIVE HERO: full viewport, photography-led, oversized type ── */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="cine cine-vignette absolute inset-0">
          <Image
            src={dogPhotos.hero}
            alt="Golden retriever rescue dog looking upward"
            fill
            className="object-cover object-center"
            sizes="100vw"
            unoptimized
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e] via-[#0b140e]/35 to-[#0b140e]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b140e]/70 via-transparent to-transparent" />

        <div className="relative flex flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20 lg:px-16">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#f4b942]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#e04a3a]" />
            Live shelter-to-rescue matching
            {onTheClock.length > 0 && (
              <span className="border border-[#e04a3a]/60 px-2 py-1 text-[#ff8a7a]">
                {onTheClock.length} on the clock
              </span>
            )}
          </div>

          <h1 className="font-black uppercase leading-[0.82] tracking-tight">
            <span className="block text-[clamp(3.2rem,11vw,10rem)] text-[#f8f1e8]">Every</span>
            <span className="block text-[clamp(3.2rem,11vw,10rem)] text-[#f4b942]">second</span>
            <span className="text-outline block text-[clamp(3.2rem,11vw,10rem)]">counts.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-[#f8f1e8]/85 sm:text-xl">
            A fast, high-signal matching platform that gets urgent dogs in front
            of the right rescue partners — before the clock runs out.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#f4b942] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#ffd86a]"
            >
              Start matching
            </Link>
            <Link
              href="/dogs?urgency=urgent"
              className="inline-flex items-center justify-center gap-3 border-2 border-[#e04a3a] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff8a7a] transition hover:bg-[#e04a3a] hover:text-white"
            >
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-current" />
              Dogs on the clock
            </Link>
          </div>
        </div>
      </section>

      {/* ── URGENCY TICKER ── */}
      <UrgentTicker
        dogs={onTheClock.map((d) => ({
          id: d.id,
          name: d.name,
          daysLeft: daysLeftLabel(d.daysLeft),
        }))}
      />

      {/* ── MISSION: oversized editorial statement ── */}
      <section className="px-5 py-24 sm:px-10 sm:py-36 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="type-quiet flex items-center gap-3"><span className="tick-diamond" />The mission</p>
          <blockquote className="mt-8">
            <p className="serif-pull text-[clamp(1.6rem,3.8vw,2.9rem)] leading-[1.4] text-[#f8f1e8]/90">
              &ldquo;Thousands of healthy, adoptable dogs are euthanized every year
              &mdash; not for lack of love, but for lack of a fast enough handoff.&rdquo;
            </p>
            <footer className="mt-6 flex items-center gap-4">
              <span className="rule-double block w-16" aria-hidden />
              <cite className="text-xs font-bold uppercase tracking-[0.24em] text-[#f8f1e8]/45 not-italic">
                Why DOGSRUN exists
              </cite>
            </footer>
          </blockquote>
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
            {[
              ["50+", "states in the network"],
              ["24/7", "matching, always on"],
              ["1-click", "rescue response"],
            ].map(([big, small]) => (
              <div key={small}>
                <p className="text-5xl font-black tracking-tight text-[#f4b942]">{big}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#f8f1e8]/50">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: asymmetric editorial, staggered ── */}
      <section className="border-t border-white/10 px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#e04a3a]">How it works</p>
              <h2 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.9] tracking-tight">
                Built for the<br />handoff <span className="text-[#f4b942]">moment.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-[#f8f1e8]/60">
              Three moves. No spreadsheets, no phone tag — just the dog, the
              details, and the rescue most likely to say yes.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-12">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`card-craft hover-lift relative overflow-hidden p-8 sm:p-10 ${
                  i === 0
                    ? "lg:col-span-5"
                    : i === 1
                      ? "lg:col-span-7 lg:mt-16"
                      : "lg:col-span-6 lg:col-start-4 lg:-mt-4"
                }`}
              >
                <span
                  aria-hidden
                  className="ghost-num pointer-events-none absolute -right-3 -top-6 select-none text-[8rem] font-black leading-none sm:text-[10rem]"
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

      {/* ── ON THE CLOCK: featured urgent dogs ── */}
      {onTheClock.length > 0 && (
        <section className="border-t border-white/10 px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#e04a3a]">
                  <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#e04a3a]" />
                  On the clock
                </p>
                <h2 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.9] tracking-tight">
                  Running out<br />of <span className="text-[#e04a3a]">time.</span>
                </h2>
              </div>
              <Link
                href="/dogs?urgency=urgent"
                className="border-b-2 border-[#f4b942] pb-1 text-sm font-black uppercase tracking-[0.2em] text-[#f4b942] transition hover:text-[#ffd86a]"
              >
                See all urgent dogs →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {onTheClock.slice(0, 3).map((dog) => (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.id}`}
                  className="group relative block overflow-hidden border-2 border-[#e04a3a] bg-[#122016]"
                >
                  <div className="cine relative aspect-[4/5] overflow-hidden">
                    {dog.photo_url ? (
                      <Image
                        src={dog.photo_url}
                        alt={dog.name || "Dog photo"}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-105"
                        unoptimized
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1a2e1a] text-8xl font-black text-[#f4b942]">
                        {dog.name?.[0] || "D"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 bg-[#e04a3a] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
                      <span className="animate-pulse-dot h-2 w-2 rounded-full bg-white" />
                      {daysLeftLabel(dog.daysLeft) || "Urgent"}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="text-4xl font-black uppercase tracking-tight text-white">{dog.name}</h3>
                      <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-[#f4b942]">{dog.breed}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SHELTER / RESCUE: bold split panels ── */}
      <section className="grid lg:grid-cols-2">
        <div className="group relative overflow-hidden border-t border-white/10 px-8 py-16 sm:px-12 sm:py-24">
          <span aria-hidden className="pointer-events-none absolute -bottom-10 right-0 select-none text-[10rem] font-black leading-none text-white/5">
            →
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f4b942]">For shelters</p>
          <h2 className="mt-5 text-[clamp(2rem,4.5vw,3.75rem)] font-black uppercase leading-[0.92] tracking-tight">
            Publish the case once. Reach the rescues that fit.
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-[#f8f1e8]/65">
            List urgent dogs, capture the details rescues need, and see who has
            responded — without managing another spreadsheet.
          </p>
          <Link
            href="/register?type=shelter"
            className="mt-9 inline-flex bg-[#f4b942] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#ffd86a]"
          >
            Register shelter
          </Link>
        </div>
        <div className="group relative overflow-hidden border-t border-white/10 bg-[#e04a3a] px-8 py-16 sm:px-12 sm:py-24">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">For rescues</p>
          <h2 className="mt-5 text-[clamp(2rem,4.5vw,3.75rem)] font-black uppercase leading-[0.92] tracking-tight text-white">
            Set your criteria. Get the dogs you can actually pull.
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-white/80">
            Define geography, breed focus, weight, age, and capacity once.
            Receive urgent alerts that respect your mission and your limits.
          </p>
          <Link
            href="/register?type=rescue"
            className="mt-9 inline-flex bg-[#140a08] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-black"
          >
            Register rescue
          </Link>
        </div>
      </section>

      {/* ── CLOSING: full-bleed photo, massive overlapping type ── */}
      <section className="relative flex min-h-[80svh] items-end overflow-hidden">
        <div className="cine cine-vignette absolute inset-0">
          <Image
            src={dogPhotos.rescue}
            alt="Expressive close-up portrait of a rescue dog"
            fill
            className="object-cover object-center"
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e] via-[#0b140e]/30 to-transparent" />
        <div className="relative w-full px-5 pb-16 sm:px-10 lg:px-16">
          <h2 className="max-w-6xl text-[clamp(3rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight">
            Every dog deserves <span className="text-[#f4b942]">a second run.</span>
          </h2>
          <Link
            href="/dogs"
            className="link-draw mt-8 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em] text-[#f8f1e8] transition hover:text-[#f4b942]"
          >
            Meet the dogs →
          </Link>
        </div>
      </section>
    </div>
  );
}
