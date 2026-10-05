import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import ApprovalWall from '@/components/approval-wall'
import AlertActions from './alert-actions'
import { daysUntilEuthanasia, daysLeftLabel, isDogUrgent } from '@/lib/urgency'

interface Alert {
  id: string
  dog_id: string
  rescue_id: string
  status: string
  sent_at: string
  dogs: {
    id: string
    name: string
    breed: string
    age_years: number | null
    sex: string | null
    photo_url: string | null
    status: string | null
    euthanasia_date: string | null
    organizations: { name: string | null; city: string | null; state: string | null } | null
  } | null
}

function shelterLine(dog: Alert['dogs']) {
  const s = dog?.organizations
  if (!s) return null
  const loc = [s.city, s.state].filter(Boolean).join(', ')
  return [s.name, loc].filter(Boolean).join(' · ')
}

export default async function RescuePortalPage() {
  const { supabase, org } = await requireAuthContext()

  if (!org || org.type !== 'rescue') redirect('/dashboard')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />

  const { data: alertsData } = await supabase
    .from('alerts')
    .select('*, dogs(*, organizations(name, city, state))')
    .eq('rescue_id', org.id)
    .order('sent_at', { ascending: false, nullsFirst: false })

  const alerts = ((alertsData || []) as unknown as Alert[])
    .map((a) => ({
      ...a,
      _urgent: isDogUrgent(a.dogs?.status, a.dogs?.euthanasia_date),
      _daysLeft: daysUntilEuthanasia(a.dogs?.euthanasia_date),
    }))
    .sort((a, b) => {
      // Needs-action first, urgent dogs first, newest first
      const aOpen = a.status === 'sent' ? 0 : 1
      const bOpen = b.status === 'sent' ? 0 : 1
      if (aOpen !== bOpen) return aOpen - bOpen
      if (Number(b._urgent) !== Number(a._urgent)) return Number(b._urgent) - Number(a._urgent)
      return new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    })

  const open = alerts.filter((a) => a.status === 'sent')
  const handled = alerts.filter((a) => a.status !== 'sent')
  const hero = open[0] || null
  const rest = open.slice(1)
  const openUrgentCount = open.filter((a) => a._urgent).length

  return (
    <div className="min-h-screen bg-[#0b140e] text-[#f8f1e8]">
      <header className="border-b border-white/10 px-5 pb-10 pt-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#7ddba3]" />
            Rescue portal · {org.name}
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.88] tracking-tight">
            Dogs that need <span className="text-[#c08a3e]">you.</span>
          </h1>
          {open.length > 0 ? (
            <p className="mt-4 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-[#c98a7a]">
              <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
              {open.length} awaiting your answer{openUrgentCount > 0 ? ` · ${openUrgentCount} urgent` : ''}
            </p>
          ) : (
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#f8f1e8]/50">
              All caught up — new matches land here the moment shelters list them.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10 lg:px-16">
        {/* ── HERO: newest match gets the spotlight ── */}
        {hero && hero.dogs && (
          <section className="relative mb-12 overflow-hidden border-2 border-[#c08a3e]">
            <div className="relative min-h-[46svh]">
              {hero.dogs.photo_url ? (
                <Image src={hero.dogs.photo_url} alt={hero.dogs.name} fill className="object-cover object-center" unoptimized priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a2e1a] text-[10rem] font-black text-[#c08a3e]">
                  {hero.dogs.name?.[0] || 'D'}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />
              <div className="absolute left-5 top-5 flex items-center gap-2 bg-[#c08a3e] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#140a08] sm:left-8 sm:top-8">
                <span className="animate-pulse-dot h-2 w-2 rounded-full bg-[#140a08]" />
                New match
              </div>
              {hero._urgent && (
                <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
                  <div className="animate-urgent-glow flex items-center gap-2 bg-[#a8583f] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                    <span className="animate-pulse-dot h-2 w-2 rounded-full bg-white" />
                    {daysLeftLabel(hero._daysLeft) || 'Urgent'}
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <h2 className="text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-tight text-white">
                  {hero.dogs.name}
                </h2>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.22em] text-[#c08a3e]">
                  {hero.dogs.breed}{hero.dogs.age_years ? ` · ${hero.dogs.age_years}y` : ''}{hero.dogs.sex ? ` · ${hero.dogs.sex}` : ''}
                </p>
                {shelterLine(hero.dogs) && (
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">{shelterLine(hero.dogs)}</p>
                )}
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <AlertActions alertId={hero.id} currentStatus={hero.status} large />
                  <Link
                    href={`/dogs/${hero.dog_id}`}
                    className="inline-flex items-center justify-center border-2 border-white/40 px-8 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white hover:bg-white hover:text-black"
                  >
                    View full profile
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── NEEDS YOUR ANSWER ── */}
        {rest.length > 0 && (
          <section className="mb-14">
            <p className="mb-6 border-b border-white/10 pb-4 text-xs font-black uppercase tracking-[0.28em] text-[#c98a7a]">
              Needs your answer
            </p>
            <div className="space-y-5">
              {rest.map((alert) => {
                const dog = alert.dogs
                return (
                  <div
                    key={alert.id}
                    className={`grid overflow-hidden border card-craft sm:grid-cols-[240px_1fr] ${
                      alert._urgent ? 'border-2 border-[#a8583f]' : 'border-white/10'
                    }`}
                  >
                    <Link href={`/dogs/${alert.dog_id}`} className="relative block min-h-[200px] overflow-hidden sm:min-h-[240px]">
                      {dog?.photo_url ? (
                        <Image src={dog.photo_url} alt={dog?.name || 'Dog photo'} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-[#1a2e1a] text-6xl font-black text-[#c08a3e]">
                          {dog?.name?.[0] || 'D'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r" />
                    </Link>
                    <div className="flex flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          {alert._urgent && (
                            <span className="flex items-center gap-2 bg-[#a8583f] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-white" />
                              {daysLeftLabel(alert._daysLeft) || 'Urgent'}
                            </span>
                          )}
                          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f8f1e8]/40">
                            Received {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : 'recently'}
                          </span>
                        </div>
                        <h3 className="mt-4 text-4xl font-black uppercase tracking-tight text-white">
                          <Link href={`/dogs/${alert.dog_id}`} className="transition hover:text-[#c08a3e]">
                            {dog?.name || 'Unnamed Dog'}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">
                          {dog?.breed || 'Unknown breed'}{dog?.age_years ? ` · ${dog.age_years}y` : ''}{dog?.sex ? ` · ${dog.sex}` : ''}
                        </p>
                        {shelterLine(dog) && (
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#f8f1e8]/50">{shelterLine(dog)}</p>
                        )}
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <AlertActions alertId={alert.id} currentStatus={alert.status} />
                        <Link
                          href={`/dogs/${alert.dog_id}`}
                          className="text-xs font-black uppercase tracking-[0.2em] text-[#f8f1e8]/60 transition hover:text-[#c08a3e]"
                        >
                          View profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── HANDLED: quiet, informational ── */}
        {handled.length > 0 && (
          <section>
            <p className="mb-6 border-b border-white/10 pb-4 text-xs font-black uppercase tracking-[0.28em] text-[#f8f1e8]/40">
              Already handled
            </p>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {handled.map((alert) => {
                const dog = alert.dogs
                return (
                  <div key={alert.id} className="flex items-center gap-5 py-4 opacity-70 transition hover:opacity-100">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-[#1a2e1a]">
                      {dog?.photo_url ? (
                        <Image src={dog.photo_url} alt={dog?.name || 'Dog photo'} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-[#c08a3e]">
                          {dog?.name?.[0] || 'D'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/dogs/${alert.dog_id}`} className="block truncate text-lg font-black text-white hover:text-[#c08a3e]">
                        {dog?.name || 'Unnamed Dog'}
                      </Link>
                      <p className="truncate text-xs uppercase tracking-[0.18em] text-[#f8f1e8]/45">
                        {dog?.breed || 'Unknown breed'}
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                      alert.status === 'responded' ? 'bg-[#7ddba3]/15 text-[#7ddba3]' : 'bg-white/10 text-[#f8f1e8]/45'
                    }`}>
                      {alert.status === 'responded' ? 'Interested' : 'Passed'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {alerts.length === 0 && (
          <div className="border border-dashed border-white/20 card-craft px-6 py-20 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">No matches yet</p>
            <h3 className="mt-4 text-4xl font-black uppercase tracking-tight">The next dog is coming.</h3>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#f8f1e8]/55">
              Make sure your matching criteria are set so urgent cases reach you first.
            </p>
            <Link
              href="/dashboard/criteria"
              className="mt-8 inline-flex bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
            >
              Set matching criteria
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
