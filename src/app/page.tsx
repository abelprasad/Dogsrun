import Image from "next/image";
import Link from "next/link";

const dogPhotos = {
  hero: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=85",
  rescue: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=1200&q=85",
};

const steps = [
  ["Intake", "Shelters publish the essential context: behavior notes, timeline, size, medical flags, and transfer constraints."],
  ["Match", "DOGSRUN compares each case against active rescue criteria and highlights the organizations most likely to say yes."],
  ["Move", "Rescues receive a focused alert with one-click response links so urgent dogs can get out faster."],
];

export default function Home() {
  return (
    <div className="bg-[#f5f0e8] text-[#17231f]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a2e1a] px-5 py-20 text-[#fff4c1] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <Image
          src={dogPhotos.hero}
          alt="Golden retriever rescue dog looking upward"
          fill
          className="object-cover object-center"
          sizes="100vw"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-[#1a2e1a]/75" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[#f4b942]/30" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-5xl">
            <div className="mb-8 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
              <span className="h-2 w-2 rounded-full bg-[#f4b942]" />
              Live shelter-to-rescue matching
            </div>
            <h1 className="text-6xl font-black leading-[0.86] tracking-tight text-[#f4b942] sm:text-7xl lg:text-8xl">
              Find the rescue before the clock wins.
            </h1>
            <p className="mt-8 max-w-3xl text-xl font-semibold leading-8 text-[#f8f1e8] sm:text-2xl sm:leading-9">
              A fast, high-signal matching platform that helps shelters reach the right rescue partners before urgent dogs run out of time.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center bg-[#f4b942] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1a2e1a] transition hover:bg-[#ffd86a]">
                Start matching
              </Link>
              <Link href="/dogs" className="inline-flex items-center justify-center border border-[#f8f1e8]/40 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#f8f1e8] transition hover:border-[#f8f1e8] hover:bg-[#f8f1e8] hover:text-[#1a2e1a]">
                View dogs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#f5f0e8] px-5 py-16 text-[#17231f] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d95f4b]">How it works</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-[#13241d] sm:text-5xl">
              Built for the handoff moment.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(([title, copy], index) => (
              <div key={title} className="border border-[#13241d]/12 bg-[#fff9ef] p-7">
                <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4b942] text-sm font-black text-[#13241d]">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-black text-[#13241d]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#5d6a64]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shelter / Rescue CTAs */}
      <section className="bg-[#1a2e1a] px-5 py-16 text-[#f8f1e8] sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="border-l-4 border-[#f59e0b] bg-[#f5f0e8] p-8 lg:p-10">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#d95f4b]">
              <span className="text-lg leading-none text-[#f59e0b]">→</span>
              For shelters
            </p>
            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-[#13241d] sm:text-4xl">Publish the case once. Reach the rescues that fit.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5d6a64]">
              List urgent dogs, capture the details rescues need, and see who has responded without managing another spreadsheet.
            </p>
            <Link href="/register?type=shelter" className="mt-8 inline-flex bg-[#13241d] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#f8f1e8] transition hover:bg-[#f4b942] hover:text-[#13241d]">
              Register shelter
            </Link>
          </div>

          <div className="border-l-4 border-[#f59e0b] bg-[#f5f0e8] p-8 lg:p-10">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#d95f4b]">
              <span className="text-lg leading-none text-[#f59e0b]">→</span>
              For rescues
            </p>
            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-[#13241d] sm:text-4xl">Set your criteria. Get the dogs you can actually pull.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5d6a64]">
              Define geography, breed focus, weight, age, and capacity once. Receive urgent alerts that respect your mission and your limits.
            </p>
            <Link href="/register?type=rescue" className="mt-8 inline-flex bg-[#13241d] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#f8f1e8] transition hover:bg-[#f4b942] hover:text-[#13241d]">
              Register rescue
            </Link>
          </div>
        </div>
      </section>

      {/* Closing — dog photo + text */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative min-h-[400px] lg:min-h-[560px]">
          <Image
            src={dogPhotos.rescue}
            alt="Expressive close-up portrait of a rescue dog"
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 50vw, 100vw"
            unoptimized
          />
        </div>
        <div className="bg-[#2d1f0e] flex items-center justify-center px-10 py-16 lg:py-24">
          <h2 className="max-w-lg text-5xl font-black leading-none tracking-tight text-[#f5f0e8] sm:text-6xl lg:text-7xl">
            Every dog deserves a second run.
          </h2>
        </div>
      </section>
    </div>
  );
}
