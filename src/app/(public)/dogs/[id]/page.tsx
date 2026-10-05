import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import { daysUntilEuthanasia, daysLeftLabel, isDogUrgent } from '@/lib/urgency'

export default async function PublicDogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: dog } = await supabaseAdmin
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .in('status', ['available', 'urgent'])
    .single()

  if (!dog) notFound()

  const cleanDescription = dog.description
    ? dog.description.replace(/\[pgeo:[A-Z0-9]+\]\s*/g, '').trim() || null
    : null

  const locationLine = (dog.organizations?.city && dog.organizations?.state)
    ? `${dog.organizations.city}, ${dog.organizations.state}`
    : null

  const urgent = isDogUrgent(dog.status, dog.euthanasia_date)
  const daysLeft = daysUntilEuthanasia(dog.euthanasia_date)
  const windowDays = Math.max(14, daysLeft ?? 0)
  const timePct = daysLeft === null ? null : Math.max(2, Math.min(100, (daysLeft / windowDays) * 100))
  const euthDateLabel = dog.euthanasia_date
    ? new Date(dog.euthanasia_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const facts: [string, string][] = [
    ['Age', dog.age_years ? `${dog.age_years} year${dog.age_years === 1 ? '' : 's'}` : '—'],
    ['Sex', dog.sex || '—'],
    ['Weight', dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'],
    ['Color', Array.isArray(dog.color) ? dog.color.join(', ') : (dog.color || '—')],
  ]

  return (
    <div className="bg-[#0b140e] pb-24 text-[#f8f1e8] md:pb-0">
      {/* ── FULL-BLEED PHOTO HERO (65vh), massive overlaid name ── */}
      <header className="relative flex min-h-[65svh] flex-col justify-end overflow-hidden">
        {dog.photo_url ? (
          <div className="cine cine-vignette absolute inset-0">
            <Image src={dog.photo_url} alt={dog.name} fill className="object-cover object-center" unoptimized priority />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a2e1a] text-[12rem] font-black text-[#c08a3e]">
            {dog.name?.[0] || 'D'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b140e] via-[#0b140e]/25 to-[#0b140e]/40" />

        <Link
          href="/dogs"
          className="absolute left-5 top-6 z-10 border border-white/20 bg-black/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur transition hover:border-[#c08a3e] hover:text-[#c08a3e] sm:left-10"
        >
          ← All dogs
        </Link>

        {urgent && (
          <div className="absolute right-5 top-6 z-10 sm:right-10">
            <div className="animate-urgent-glow flex items-center gap-2 bg-[#a8583f] px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-white">
              <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-white" />
              {daysLeftLabel(daysLeft) || 'Urgent'}
            </div>
          </div>
        )}

        <div className="relative px-5 pb-10 sm:px-10 lg:px-16">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            {dog.breed}{dog.mix ? ' mix' : ''}
            {dog.dogsrun_id && <span className="ml-3 text-[#f8f1e8]/40">· {dog.dogsrun_id}</span>}
          </p>
          <h1 className="text-[clamp(3.5rem,12vw,10rem)] font-black uppercase leading-[0.82] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            {dog.name}
          </h1>
          {locationLine && (
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.24em] text-[#f8f1e8]/70">
              {dog.organizations?.name} — {locationLine}
            </p>
          )}
        </div>
      </header>

      {/* ── URGENCY TIMELINE ── */}
      {urgent && timePct !== null && (
        <section className="rule-double border-b border-white/10 bg-[#a8583f]/10 px-5 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c98a7a]">
                  <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
                  Time remaining
                </p>
                <p className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-none tracking-tight text-white">
                  {daysLeftLabel(daysLeft)}
                </p>
              </div>
              {euthDateLabel && (
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f8f1e8]/60">
                  Scheduled {euthDateLabel}
                </p>
              )}
            </div>
            <div className="mt-6 h-4 w-full overflow-hidden bg-black/50">
              <div
                className={`h-full transition-all ${daysLeft !== null && daysLeft <= 3 ? 'bg-[#a8583f]' : 'bg-[#c08a3e]'}`}
                style={{ width: `${timePct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-[0.22em] text-[#f8f1e8]/40">
              <span>Now</span>
              <span>{windowDays}-day window</span>
            </div>
          </div>
        </section>
      )}

      {/* ── EDITORIAL TWO-COLUMN ── */}
      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: the story */}
          <div className="lg:col-span-7">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">The story</p>
            {cleanDescription ? (
              <blockquote className="mt-6 border-l-2 border-[#c08a3e]/70 pl-6 serif-pull text-[clamp(1.35rem,2.8vw,2rem)] leading-[1.5] text-[#f8f1e8]/90">
                &ldquo;{cleanDescription}&rdquo;
              </blockquote>
            ) : (
              <p className="mt-6 text-lg leading-8 text-[#f8f1e8]/60">
                The shelter hasn&apos;t written {dog.name ? `${dog.name}'s` : 'this dog\'s'} story yet —
                but the clock is still ticking. Reach out to learn more.
              </p>
            )}

            <div className="card-craft mt-12 p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">Listed by</p>
              <p className="mt-3 text-2xl font-black text-white">{dog.organizations?.name || 'Shelter partner'}</p>
              {locationLine && <p className="mt-1 text-sm uppercase tracking-[0.18em] text-[#f8f1e8]/50">{locationLine}</p>}
            </div>
          </div>

          {/* Right: the facts, oversized */}
          <div className="lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">The facts</p>
            <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-6 py-5">
                  <dt className="text-xs font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{label}</dt>
                  <dd className="text-right text-2xl font-black capitalize text-white">{value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-6 py-5">
                <dt className="text-xs font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">Status</dt>
                <dd className={`text-right text-2xl font-black uppercase ${urgent ? 'text-[#c98a7a]' : 'text-[#c08a3e]'}`}>
                  {urgent ? 'Urgent' : dog.status}
                </dd>
              </div>
            </dl>

            <Link
              href="/register?type=rescue"
              className="mt-8 hidden w-full bg-[#c08a3e] py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-[#140a08] transition hover:bg-[#d4a050] md:block"
            >
              I&apos;m interested in {dog.name || 'this dog'}
            </Link>
            <p className="mt-4 hidden text-center text-xs leading-6 text-[#f8f1e8]/45 md:block">
              Rescues respond in one click. Shelters see your interest instantly.
            </p>
          </div>
        </div>
      </main>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#c08a3e]/30 bg-[#0b140e]/95 p-4 backdrop-blur md:hidden">
        <Link
          href="/register?type=rescue"
          className="flex w-full items-center justify-center gap-3 bg-[#c08a3e] py-4 text-sm font-black uppercase tracking-[0.2em] text-[#140a08]"
        >
          {urgent && <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />}
          I&apos;m interested{urgent && daysLeft !== null && daysLeft > 0 ? ` — ${daysLeftLabel(daysLeft)}` : ''}
        </Link>
      </div>
    </div>
  )
}
