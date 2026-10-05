import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-server'
import { daysUntilEuthanasia, daysLeftLabel, isDogUrgent } from '@/lib/urgency'
import Pagination from '@/components/ui/pagination'
import BrowseFilters, { type UrgencyFilter } from '@/components/browse-filters'

const PAGE_SIZE = 12

type Tab = 'dogs' | 'shelters' | 'rescues'

interface OrganizationSummary {
  id: string
  name: string | null
  city: string | null
  state: string | null
}

interface DogCard {
  id: string
  name: string | null
  breed: string | null
  mix: boolean | null
  age_years: number | null
  weight_lbs: number | null
  sex: string | null
  color?: string[] | null
  status: string | null
  euthanasia_date: string | null
  photo_url: string | null
  dogsrun_id: string | null
  organizations: OrganizationSummary | null
}

interface ShelterCard extends OrganizationSummary {
  dog_count: number
}

interface RescueCriteriaSummary {
  breeds: string[] | null
  states_served: string[] | null
}

interface RescueCard extends OrganizationSummary {
  criteria: RescueCriteriaSummary | null
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'dogs', label: 'Dogs' },
  { key: 'shelters', label: 'Shelters' },
  { key: 'rescues', label: 'Rescues' },
]

const HERO: Record<Tab, { heading: string; sub: string }> = {
  dogs: {
    heading: 'Find the dog before the clock wins.',
    sub: 'Every urgent case in the DOGSRUN network, sorted by time left. Open a profile to see what the shelter needs you to know first.',
  },
  shelters: {
    heading: 'Shelters in the network.',
    sub: 'Approved, verified shelters actively listing dogs for rescue.',
  },
  rescues: {
    heading: 'Rescues in the network.',
    sub: "Active rescue organizations and the dogs they're ready to take.",
  },
}

function parsePageParam(value: string | undefined): number {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function sanitizeQuery(q: string | undefined): string {
  return (q || '').replace(/[%(),]/g, '').trim().slice(0, 60)
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; state?: string; q?: string; urgency?: string }>
}) {
  const { tab: tabParam, page: pageParam, state: stateParam, q: qParam, urgency: urgencyParam } = await searchParams
  const stateFilter = stateParam && stateParam.length === 2 ? stateParam.toUpperCase() : ''
  const tab: Tab = (tabParam === 'shelters' || tabParam === 'rescues') ? tabParam : 'dogs'
  const urgency: UrgencyFilter = urgencyParam === 'urgent' || urgencyParam === 'available' ? urgencyParam : 'all'
  const query = sanitizeQuery(qParam)
  const page = parsePageParam(pageParam)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const baseParams = (extra: Record<string, string | null>) => {
    const p = new URLSearchParams()
    p.set('tab', tab)
    if (stateFilter) p.set('state', stateFilter)
    if (query) p.set('q', query)
    if (urgency !== 'all') p.set('urgency', urgency)
    for (const [k, v] of Object.entries(extra)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    return `/dogs?${p.toString()}`
  }

  // ── Dogs ──────────────────────────────────────────────────────────────────
  let dogs: (DogCard & { _daysLeft: number | null; _urgent: boolean })[] = []
  let dogCount = 0
  let totalPages = 1

  if (tab === 'dogs') {
    let dbQuery = supabaseAdmin
      .from('dogs')
      .select('*, organizations!inner(name, city, state)', { count: 'exact' })
      .eq('organizations.is_test', false)
      .order('euthanasia_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (urgency === 'urgent') {
      dbQuery = dbQuery.in('status', ['available', 'urgent']).or('status.eq.urgent,euthanasia_date.not.is.null')
    } else if (urgency === 'available') {
      dbQuery = dbQuery.eq('status', 'available').is('euthanasia_date', null)
    } else {
      dbQuery = dbQuery.in('status', ['available', 'urgent'])
    }

    if (stateFilter) dbQuery = dbQuery.eq('organizations.state', stateFilter)
    if (query) dbQuery = dbQuery.or(`name.ilike.%${query}%,breed.ilike.%${query}%`)

    const { data, count } = await dbQuery
    const rows = (data || []) as DogCard[]
    dogs = rows
      .map((d) => {
        const daysLeft = daysUntilEuthanasia(d.euthanasia_date)
        return { ...d, _daysLeft: daysLeft, _urgent: isDogUrgent(d.status, d.euthanasia_date) }
      })
      .sort((a, b) => Number(b._urgent) - Number(a._urgent))
    dogCount = count || 0
    totalPages = Math.max(1, Math.ceil(dogCount / PAGE_SIZE))
  }

  // ── Shelters ──────────────────────────────────────────────────────────────
  let shelters: ShelterCard[] = []

  if (tab === 'shelters') {
    let shelterQuery = supabaseAdmin
      .from('organizations')
      .select('id, name, city, state')
      .eq('type', 'shelter')
      .eq('approval_status', 'approved')
      .eq('is_test', false)
      .order('name')
    if (stateFilter) shelterQuery = shelterQuery.eq('state', stateFilter)
    if (query) shelterQuery = shelterQuery.ilike('name', `%${query}%`)
    const { data } = await shelterQuery
    const shelterOrgs = (data || []) as OrganizationSummary[]

    const counts = await Promise.all(
      shelterOrgs.map(s =>
        supabaseAdmin
          .from('dogs')
          .select('id', { count: 'exact', head: true })
          .eq('shelter_id', s.id)
          .in('status', ['available', 'urgent'])
      )
    )
    shelters = shelterOrgs.map((s, i) => ({ ...s, dog_count: counts[i].count || 0 }))
  }

  // ── Rescues ───────────────────────────────────────────────────────────────
  let rescues: RescueCard[] = []

  if (tab === 'rescues') {
    let rescueQuery = supabaseAdmin
      .from('organizations')
      .select('id, name, city, state')
      .eq('type', 'rescue')
      .eq('approval_status', 'approved')
      .eq('is_test', false)
      .order('name')
    if (stateFilter) rescueQuery = rescueQuery.eq('state', stateFilter)
    if (query) rescueQuery = rescueQuery.ilike('name', `%${query}%`)
    const { data } = await rescueQuery
    const orgs = (data || []) as OrganizationSummary[]

    const criteria = await Promise.all(
      orgs.map(o =>
        supabaseAdmin
          .from('rescue_criteria')
          .select('breeds, states_served')
          .eq('rescue_id', o.id)
          .eq('is_active', true)
          .maybeSingle()
      )
    )
    rescues = orgs.map((o, i) => ({ ...o, criteria: criteria[i].data as RescueCriteriaSummary | null }))
  }

  const hero = HERO[tab]
  const urgentCount = dogs.filter((d) => d._urgent).length

  return (
    <div className="min-h-screen bg-[#0b140e] text-[#f8f1e8]">
      {/* Hero */}
      <header className="border-b border-white/10 px-5 pb-10 pt-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
            DOGSRUN Network
          </p>
          <h1 className="max-w-5xl text-[clamp(2.75rem,7vw,6rem)] font-black uppercase leading-[0.88] tracking-tight">
            {hero.heading.split('clock')[0]}
            {hero.heading.includes('clock') && <span className="text-[#a8583f]">clock</span>}
            {hero.heading.includes('clock') && hero.heading.split('clock')[1]}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#f8f1e8]/60">{hero.sub}</p>

          {/* Tabs */}
          <div className="mt-10 flex gap-2">
            {TABS.map(t => (
              <Link
                key={t.key}
                href={baseParams({ tab: t.key, page: null })}
                className={`px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                  tab === t.key
                    ? 'bg-[#c08a3e] text-[#140a08]'
                    : 'border border-white/15 text-[#f8f1e8]/50 hover:border-[#c08a3e]/60 hover:text-[#f8f1e8]'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10 lg:px-16">
        <BrowseFilters tab={tab} currentState={stateFilter} currentUrgency={urgency} currentQuery={query} />

        {tab === 'dogs' && (
          <>
            {urgentCount > 0 && urgency === 'all' && !query && (
              <p className="mb-8 flex items-center gap-3 border-l-4 border-[#a8583f] bg-[#a8583f]/10 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#c98a7a]">
                <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#a8583f]" />
                {urgentCount} dog{urgentCount !== 1 ? 's' : ''} on this page {urgentCount !== 1 ? 'are' : 'is'} running out of time
              </p>
            )}
            {dogs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {dogs.map((dog) => dog._urgent ? (
                    // ── FEATURED URGENT CARD: 2x, horizontal, dramatic ──
                    <Link
                      key={dog.id}
                      href={`/dogs/${dog.id}`}
                      className="card-craft-deep hover-lift hover-press group relative block overflow-hidden border-2 border-[#a8583f] sm:col-span-2"
                    >
                      <div className="grid sm:grid-cols-2">
                        <div className="cine relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-[320px]">
                          {dog.photo_url ? (
                            <Image
                              src={dog.photo_url}
                              alt={dog.name || 'Dog photo'}
                              fill
                              className="object-cover transition duration-700 group-hover:scale-105"
                              unoptimized
                              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 80vw, 100vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#1a2e1a] text-8xl font-black text-[#c08a3e]">
                              {dog.name?.[0] || 'D'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:bg-gradient-to-r" />
                        </div>
                        <div className="flex flex-col justify-between p-7 sm:p-9">
                          <div>
                            <div className="animate-urgent-glow inline-flex items-center gap-2 bg-[#a8583f] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
                              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-white" />
                              {daysLeftLabel(dog._daysLeft) || 'Urgent'}
                            </div>
                            <h2 className="mt-5 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                              {dog.name || 'Unnamed Dog'}
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">
                              {dog.breed}{dog.mix ? ' mix' : ''}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#f8f1e8]/70">
                              <span><span className="font-black text-white">{dog.age_years ? `${dog.age_years}y` : '—'}</span> old</span>
                              <span><span className="font-black capitalize text-white">{dog.sex || '—'}</span></span>
                              <span><span className="font-black text-white">{dog.weight_lbs ? `${dog.weight_lbs} lb` : '—'}</span></span>
                            </div>
                          </div>
                          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-[#f8f1e8]/50">
                              {dog.organizations?.name || 'Shelter partner'}
                              {dog.organizations?.state ? ` · ${dog.organizations.state}` : ''}
                            </p>
                            <span className="text-sm font-black uppercase tracking-[0.18em] text-[#c98a7a] transition group-hover:text-white">
                              Act now →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    // ── STANDARD CARD ──
                    <Link
                      key={dog.id}
                      href={`/dogs/${dog.id}`}
                      className="card-craft hover-lift hover-press group flex min-h-full flex-col overflow-hidden hover:border-[#c08a3e]/60"
                    >
                      <div className="cine relative aspect-[5/4] overflow-hidden">
                        {dog.photo_url ? (
                          <Image
                            src={dog.photo_url}
                            alt={dog.name || 'Dog photo'}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-105"
                            unoptimized
                            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#1a2e1a] text-7xl font-black text-[#436154]">
                            {dog.name?.[0] || 'D'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute left-4 top-4">
                          <span className="bg-[#c08a3e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#140a08]">
                            Available
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <h2 className="text-3xl font-black uppercase tracking-tight text-white">{dog.name || 'Unnamed Dog'}</h2>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#c08a3e]">
                            {dog.breed}{dog.mix ? ' mix' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-4 p-5">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#f8f1e8]/50">
                          {dog.age_years ? `${dog.age_years}y` : '—'} · <span className="capitalize">{dog.sex || '—'}</span> · {dog.weight_lbs ? `${dog.weight_lbs} lb` : '—'}
                        </p>
                        <span className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-[#c08a3e] group-hover:underline">
                          Review →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  getHref={(p) => baseParams({ page: String(p) })}
                  summary={<>Page {page} of {totalPages} · {dogCount} dogs</>}
                />
              </>
            ) : (
              <div className="card-craft rule-double px-6 py-20 text-center">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#c08a3e]">No dogs found</p>
                <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#f8f1e8]/60">
                  {query ? `Nothing matches "${query}". Try a different name or breed.` : 'No dogs match these filters right now.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Shelters tab ── */}
        {tab === 'shelters' && (
          shelters.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shelters.map((shelter) => (
                <Link
                  key={shelter.id}
                  href="/dogs?tab=dogs"
                  className="card-craft hover-lift hover-press group p-7 hover:border-[#c08a3e]/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#c08a3e] text-2xl font-black text-[#140a08]">
                      {shelter.name?.[0] || 'S'}
                    </div>
                    <span className="border border-[#c08a3e]/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#c08a3e]">
                      Verified
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-tight text-white">{shelter.name}</h2>
                  {(shelter.city || shelter.state) && (
                    <p className="mt-1 text-sm text-[#f8f1e8]/50">
                      {shelter.city}{shelter.city && shelter.state ? ', ' : ''}{shelter.state}
                    </p>
                  )}
                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f8f1e8]/40">Dogs listed</p>
                      <p className="mt-1 text-4xl font-black text-[#c08a3e]">{shelter.dog_count}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#c08a3e] group-hover:underline">
                      View dogs →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-craft rule-double px-6 py-20 text-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#c08a3e]">No shelter partners</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#f8f1e8]/60">
                {stateFilter ? `No approved shelters in ${stateFilter}.` : "Shelters appear here once approved by the DOGSRUN team."}
              </p>
            </div>
          )
        )}

        {/* ── Rescues tab ── */}
        {tab === 'rescues' && (
          rescues.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rescues.map((rescue) => {
                const breeds: string[] = rescue.criteria?.breeds || []
                const states: string[] = rescue.criteria?.states_served || []
                return (
                  <div key={rescue.id} className="card-craft p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#a8583f] text-2xl font-black text-white">
                        {rescue.name?.[0] || 'R'}
                      </div>
                      <span className="border border-[#a8583f]/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#c98a7a]">
                        Active rescue
                      </span>
                    </div>
                    <h2 className="mt-5 text-2xl font-black tracking-tight text-white">{rescue.name}</h2>
                    {(rescue.city || rescue.state) && (
                      <p className="mt-1 text-sm text-[#f8f1e8]/50">
                        {rescue.city}{rescue.city && rescue.state ? ', ' : ''}{rescue.state}
                      </p>
                    )}
                    {states.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f8f1e8]/40">Serves</p>
                        <div className="flex flex-wrap gap-1.5">
                          {states.slice(0, 8).map(s => (
                            <span key={s} className="bg-[#c08a3e] px-2 py-0.5 text-[10px] font-black text-[#140a08]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {breeds.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f8f1e8]/40">Breed focus</p>
                        <p className="text-sm text-[#f8f1e8]/70">{breeds.slice(0, 4).join(', ')}{breeds.length > 4 ? ` +${breeds.length - 4}` : ''}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card-craft rule-double px-6 py-20 text-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#c08a3e]">No rescue partners</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#f8f1e8]/60">
                {stateFilter ? `No approved rescues in ${stateFilter}.` : "Rescues appear here once approved by the DOGSRUN team."}
              </p>
            </div>
          )
        )}
      </main>
    </div>
  )
}
